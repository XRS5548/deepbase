import { db } from "@/db"
import { workflowExecutions, emailAccounts, emailLogs, dbValues, databases } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { sendEmail } from "@/lib/email-utils"
import { pushNotification } from "@/lib/notification-utils"
import type { WorkflowFlowNode, WorkflowFlowEdge, ExecutionLogEntry, WorkflowNodeType } from "@/lib/workflow-types"

export type ExecutionResult = {
  success: boolean
  status: "completed" | "failed"
  stepsLog: ExecutionLogEntry[]
  error?: string
}

type StepHandler = (
  node: WorkflowFlowNode,
  context: Record<string, unknown>,
) => Promise<{ success: boolean; output?: Record<string, unknown>; error?: string }>

function parseDelay(duration: string): number {
  const match = duration.match(/^(\d+)([smh])$/)
  if (!match) return 0
  const val = parseInt(match[1], 10)
  const unit = match[2]
  switch (unit) {
    case "s": return val * 1000
    case "m": return val * 60 * 1000
    case "h": return val * 3600 * 1000
    default: return 0
  }
}

function evaluateCondition(
  field: string,
  operator: string,
  value: string,
  context: Record<string, unknown>,
): boolean {
  const actual = context[field]
  if (actual === undefined) return false

  switch (operator) {
    case "equals":
      return String(actual) === value
    case "not_equals":
      return String(actual) !== value
    case "contains":
      return String(actual).includes(value)
    case "greater_than":
      return Number(actual) > Number(value)
    case "less_than":
      return Number(actual) < Number(value)
    default:
      return false
  }
}

function interpolate(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{\{context\.(\w+)\}\}/g, (_, key) => {
    return context[key] !== undefined ? String(context[key]) : `{{context.${key}}}`
  })
}

// Step handler factory
function createStepHandler(workflowId: string, userId: string, triggeredBy: string): StepHandler {
  return async (node: WorkflowFlowNode, context: Record<string, unknown>) => {
    const cfg = node.data.config as Record<string, unknown>
    const type = node.type as WorkflowNodeType

    switch (type) {
      case "trigger":
        return { success: true, output: { triggered: true } }

      case "send_email": {
        const accountId = cfg.accountId as string
        const to = cfg.to as string
        const subject = cfg.subject as string
        const body = cfg.body as string
        const accountName = cfg.accountName as string
        const accountEmail = cfg.accountEmail as string

        if (!accountId) return { success: false, error: "No email account selected" }
        if (!to) return { success: false, error: "No recipient specified" }

        const [account] = await db
          .select()
          .from(emailAccounts)
          .where(eq(emailAccounts.id, accountId))

        if (!account) return { success: false, error: "Email account not found" }

        try {
          await sendEmail(
            {
              host: account.smtpHost,
              port: account.smtpPort,
              user: account.smtpUser,
              pass: account.smtpPass,
              useSSL: account.useSSL,
            },
            account.name,
            to,
            subject,
            body,
          )

          await db.insert(emailLogs).values({
            accountId: account.id,
            fromEmail: account.email,
            toEmail: to,
            subject,
            body,
            status: "sent",
          })

          return { success: true, output: { to, subject } }
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : "Unknown email error"
          await db.insert(emailLogs).values({
            accountId: account.id,
            fromEmail: account.email,
            toEmail: to,
            subject,
            body,
            status: "failed",
            error: errMsg,
          })
          return { success: false, error: errMsg }
        }
      }

      case "notification": {
        const message = cfg.message as string
        const title = cfg.title as string

        await pushNotification({
          userId,
          title: title || "Workflow Notification",
          description: message || "",
          icon: "Bell",
        })

        return { success: true, output: { notified: true } }
      }

      case "webhook": {
        const url = cfg.url as string
        const method = (cfg.method as string) || "POST"
        const bodyStr = cfg.body as string

        if (!url) return { success: false, error: "No webhook URL configured" }

        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 10000)

          const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: bodyStr ? interpolate(bodyStr, context) : undefined,
            signal: controller.signal,
          })

          clearTimeout(timeout)
          const responseBody = await response.text()

          let parsed: unknown = null
          try { parsed = JSON.parse(responseBody) } catch { parsed = responseBody }

          return {
            success: response.ok,
            output: { status: response.status, body: responseBody.slice(0, 200), parsed },
            error: response.ok ? undefined : `HTTP ${response.status}`,
          }
        } catch (e) {
          return {
            success: false,
            error: e instanceof Error ? e.message : "Webhook request failed",
          }
        }
      }

      case "delay": {
        const duration = cfg.duration as string
        if (!duration) return { success: true }

        const ms = parseDelay(duration)
        const maxDelay = 55_000

        if (ms > maxDelay) {
          const actualMs = Math.min(ms, maxDelay)
          await new Promise((resolve) => setTimeout(resolve, actualMs))
          return {
            success: true,
            output: { duration, note: `Delay capped at ${maxDelay / 1000}s for serverless` },
          }
        }

        await new Promise((resolve) => setTimeout(resolve, ms))
        return { success: true, output: { duration, waitedMs: ms } }
      }

      case "condition": {
        const field = cfg.field as string
        const operator = cfg.operator as string
        const value = cfg.value as string

        if (!field || !operator) {
          return { success: false, error: "Condition not configured" }
        }

        const result = evaluateCondition(field, operator, value, context)
        return { success: true, output: { result, field, operator, value } }
      }

      case "trigger_db": {
        const action = cfg.action as string
        const dbId = cfg.dbId as string
        const rawData = cfg.data as string
        const filter = cfg.filter as string

        if (!action) return { success: false, error: "No database action configured" }
        if (!dbId) return { success: false, error: "No database selected" }

        let data: Record<string, unknown> = {}
        if (rawData) {
          try {
            data = JSON.parse(rawData)
          } catch {
            return { success: false, error: "Invalid JSON data" }
          }
        }

        try {
          switch (action) {
            case "create_record": {
              if (Object.keys(data).length === 0) {
                return { success: false, error: "No data provided for creation" }
              }
              const [record] = await db
                .insert(dbValues)
                .values({
                  dbId,
                  values: data,
                  submittedBy: userId || triggeredBy,
                })
                .returning()
              return { success: true, output: { action, dbId, record } }
            }

            case "update_record": {
              if (Object.keys(data).length === 0) {
                return { success: false, error: "No data provided for update" }
              }
              // filter is expected to be a record ID from context
              let recordIdToUpdate = filter
              if (filter && filter.startsWith("{{context.")) {
                const contextKey = filter.replace("{{context.", "").replace("}}", "")
                recordIdToUpdate = String(context[contextKey] || "")
              }
              if (!recordIdToUpdate) {
                return { success: false, error: "Update requires a record ID. Use the filter field with {{context.recordId}}" }
              }
              const [updated] = await db
                .update(dbValues)
                .set({ values: data, updatedAt: new Date() })
                .where(and(eq(dbValues.id, recordIdToUpdate), eq(dbValues.dbId, dbId)))
                .returning()
              if (!updated) return { success: false, error: "Record not found" }
              return { success: true, output: { action, dbId, record: updated } }
            }

            case "delete_record": {
              let recordIdToDelete = filter
              if (filter && filter.startsWith("{{context.")) {
                const contextKey = filter.replace("{{context.", "").replace("}}", "")
                recordIdToDelete = String(context[contextKey] || "")
              }
              if (!recordIdToDelete) {
                return { success: false, error: "Delete requires a record ID. Use the filter field with {{context.recordId}}" }
              }
              const [deleted] = await db
                .delete(dbValues)
                .where(and(eq(dbValues.id, recordIdToDelete), eq(dbValues.dbId, dbId)))
                .returning()
              if (!deleted) return { success: false, error: "Record not found" }
              return { success: true, output: { action, dbId, record: deleted } }
            }

            default:
              return { success: false, error: `Unknown action: ${action}` }
          }
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : "Database operation failed"
          return { success: false, error: errMsg }
        }
      }

      case "transform": {
        const expression = cfg.expression as string
        const outputKey = cfg.outputKey as string || "transformed"

        if (!expression) return { success: false, error: "No expression configured" }

        try {
          const fn = new Function("context", `"use strict"; return (${expression});`)
          const result = fn(context)
          return { success: true, output: { [outputKey]: result, result, expression } }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Transform expression failed" }
        }
      }

      case "log": {
        const message = cfg.message as string
        const logLevel = cfg.level as string || "info"

        const interpolated = message ? interpolate(message, context) : "Log node executed"
        const output = { message: interpolated, level: logLevel, timestamp: new Date().toISOString() }

        // Just log to execution log — no side effects
        return { success: true, output }
      }

      default:
        return { success: false, error: `Unknown step type: ${type}` }
    }
  }
}

export async function executeWorkflow(
  workflowId: string,
  nodes: WorkflowFlowNode[],
  edges: WorkflowFlowEdge[],
  triggeredBy: string,
  context: Record<string, unknown> = {},
  userId?: string,
): Promise<ExecutionResult> {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  // Build adjacency list
  const outgoing = new Map<string, { target: string; sourceHandle?: string }[]>()
  const incoming = new Map<string, { source: string; sourceHandle?: string }[]>()
  for (const node of nodes) {
    outgoing.set(node.id, [])
    incoming.set(node.id, [])
  }
  for (const edge of edges) {
    outgoing.get(edge.source)?.push({ target: edge.target, sourceHandle: edge.sourceHandle })
    incoming.get(edge.target)?.push({ source: edge.source, sourceHandle: edge.sourceHandle })
  }

  // Find trigger node
  const triggerNode = nodes.find((n) => n.type === "trigger")
  if (!triggerNode) {
    return { success: false, status: "failed", stepsLog: [], error: "No trigger node found" }
  }

  const stepHandler = createStepHandler(workflowId, userId || triggeredBy, triggeredBy)

  // Create execution log entry
  const [execution] = await db
    .insert(workflowExecutions)
    .values({
      workflowId,
      triggeredBy,
      status: "running",
      stepsLog: [],
    })
    .returning()

  const stepsLog: ExecutionLogEntry[] = []
  let overallSuccess = true

  // Shared context — starts with initial context, gets enriched by each step's output
  const sharedContext: Record<string, unknown> = { ...context }

  try {
    // BFS traversal from trigger
    const visited = new Set<string>()
    const queue: string[] = [triggerNode.id]

    while (queue.length > 0) {
      const currentId = queue.shift()!
      if (visited.has(currentId)) continue
      visited.add(currentId)

      const node = nodeMap.get(currentId)
      if (!node) continue

      // Create step log entry
      const logEntry: ExecutionLogEntry = {
        stepId: node.id,
        nodeType: node.type as WorkflowNodeType,
        label: node.data.label,
        status: "running",
        startedAt: new Date().toISOString(),
      }
      stepsLog.push(logEntry)

      // Execute step handler
      const result = await stepHandler(node, sharedContext)

      if (result.success) {
        logEntry.status = "completed"
        logEntry.output = result.output

        // Merge step output into shared context so downstream steps can access it
        if (result.output) {
          Object.assign(sharedContext, result.output)
          // Also store under step label for named access
          sharedContext[`step.${node.id}`] = result.output
        }
      } else {
        logEntry.status = "failed"
        logEntry.error = result.error
        overallSuccess = false
      }
      logEntry.completedAt = new Date().toISOString()

      // Update execution log in DB periodically
      await db
        .update(workflowExecutions)
        .set({ stepsLog })
        .where(eq(workflowExecutions.id, execution.id))

      // For failed steps, stop execution (unless it's the trigger)
      if (!result.success && node.type !== "trigger") {
        break
      }

      // Find next nodes
      const nextEdges = outgoing.get(currentId) || []

      for (const edge of nextEdges) {
        // For condition nodes, follow only the matching branch
        if (node.type === "condition") {
          const conditionResult = result.output?.result === true
          const shouldFollow =
            (edge.sourceHandle === "true" && conditionResult) ||
            (edge.sourceHandle === "false" && !conditionResult)

          if (shouldFollow && !visited.has(edge.target)) {
            queue.push(edge.target)
          }
        } else {
          // Regular nodes: follow all outgoing edges
          if (!visited.has(edge.target)) {
            queue.push(edge.target)
          }
        }
      }
    }

    const status = overallSuccess ? "completed" : "failed"

    await db
      .update(workflowExecutions)
      .set({
        status,
        stepsLog,
        completedAt: new Date(),
      })
      .where(eq(workflowExecutions.id, execution.id))

    return { success: overallSuccess, status, stepsLog }
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : "Unknown execution error"

    await db
      .update(workflowExecutions)
      .set({
        status: "failed",
        stepsLog,
        error: errorMsg,
        completedAt: new Date(),
      })
      .where(eq(workflowExecutions.id, execution.id))

    return { success: false, status: "failed", stepsLog, error: errorMsg }
  }
}
