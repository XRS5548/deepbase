import { NextRequest, NextResponse } from "next/server"
import { getSession, errorResponse } from "@/lib/api-utils"
import { db } from "@/db"
import { workflowExecutions, workflows } from "@/db/schema"
import { eq, inArray, desc } from "drizzle-orm"

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession()

    const userWorkflows = await db
      .select({ id: workflows.id, name: workflows.name })
      .from(workflows)
      .where(eq(workflows.createdBy, session.user.id))

    if (userWorkflows.length === 0) {
      return NextResponse.json({ logs: [] })
    }

    const workflowIds = userWorkflows.map((w) => w.id)
    const workflowNames = new Map(userWorkflows.map((w) => [w.id, w.name]))

    const executions = await db
      .select()
      .from(workflowExecutions)
      .where(inArray(workflowExecutions.workflowId, workflowIds))
      .orderBy(desc(workflowExecutions.startedAt))
      .limit(200)

    const logs: Array<{
      id: string
      executionId: string
      workflowId: string
      workflowName: string
      stepId: string
      label: string
      message: string
      level: string
      timestamp: string
      executedAt: string
    }> = []

    for (const exec of executions) {
      const steps = exec.stepsLog as unknown as Array<{
        stepId: string
        nodeType: string
        status: string
        label?: string
        output?: Record<string, unknown>
        completedAt?: string
      }>
      for (const step of steps) {
        if (step.nodeType === "log" && step.status === "completed" && step.output) {
          logs.push({
            id: exec.id + "-" + step.stepId,
            executionId: exec.id,
            workflowId: exec.workflowId,
            workflowName: workflowNames.get(exec.workflowId) || "Unknown",
            stepId: step.stepId,
            label: step.label || "Log",
            message: (step.output.message as string) || "",
            level: (step.output.level as string) || "info",
            timestamp: (step.output.timestamp as string) || step.completedAt || exec.startedAt.toISOString(),
            executedAt: exec.startedAt.toISOString(),
          })
        }
      }
    }

    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ logs })
  } catch (e) {
    return errorResponse(e, 500)
  }
}
