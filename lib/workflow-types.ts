// ─── Node Types ───────────────────────────────────────────────────────────────

export type WorkflowNodeType =
  | "trigger"
  | "send_email"
  | "notification"
  | "webhook"
  | "delay"
  | "condition"
  | "trigger_db"
  | "transform"
  | "log"

// ─── Per-node-type Config Shapes ──────────────────────────────────────────────

export type TriggerConfig = {
  description?: string
}

export type SendEmailConfig = {
  accountId?: string
  accountName?: string
  accountEmail?: string
  to: string
  subject: string
  body: string
}

export type NotificationConfig = {
  message: string
  title?: string
  url?: string
}

export type WebhookConfig = {
  url: string
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  headers?: Record<string, string>
  body?: string
}

export type DelayConfig = {
  duration: string // e.g. "1h", "30m", "5s"
  unit?: "seconds" | "minutes" | "hours"
}

export type ConditionConfig = {
  field: string
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than"
  value: string
}

export type TriggerDbConfig = {
  action: "create_record" | "update_record" | "delete_record"
  dbId?: string
  dbName?: string
  data?: string
  filter?: string
}

export type TransformConfig = {
  expression: string
  outputKey?: string
}

export type LogConfig = {
  message: string
  level?: "info" | "warn" | "error"
}

// ─── Union Config Type ────────────────────────────────────────────────────────

export type NodeConfig =
  | TriggerConfig
  | SendEmailConfig
  | NotificationConfig
  | WebhookConfig
  | DelayConfig
  | ConditionConfig
  | TriggerDbConfig
  | TransformConfig
  | LogConfig

// ─── React Flow Node Data ─────────────────────────────────────────────────────

export type WorkflowNodeData = {
  label: string
  type: WorkflowNodeType
  config: NodeConfig
}

// ─── Persisted Node & Edge Shapes ─────────────────────────────────────────────

export type WorkflowFlowNode = {
  id: string
  type: WorkflowNodeType
  position: { x: number; y: number }
  data: WorkflowNodeData
}

export type WorkflowFlowEdge = {
  id: string
  source: string
  target: string
  sourceHandle?: string
  label?: string
}

// ─── Execution Log ────────────────────────────────────────────────────────────

export type ExecutionLogEntry = {
  stepId: string
  nodeType: WorkflowNodeType
  label: string
  status: "pending" | "running" | "completed" | "failed" | "skipped"
  startedAt?: string
  completedAt?: string
  error?: string
  output?: Record<string, unknown>
}

// ─── Legacy Step (backward compat) ────────────────────────────────────────────

export type WorkflowStep = {
  id: string
  type: WorkflowNodeType
  label: string
  config: Record<string, unknown>
}

// ─── Full Workflow Item (API response shape) ────────────────────────────────

export type WorkflowItem = {
  id: string
  name: string
  description: string | null
  icon: string | null
  bgColor: string | null
  steps: WorkflowStep[]
  nodes: WorkflowFlowNode[]
  edges: WorkflowFlowEdge[]
  webhookSecret: string | null
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ─── Email Account (from API) ──────────────────────────────────────────────

export type EmailAccount = {
  id: string
  name: string
  email: string
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPass: string
  useSSL: boolean
  createdAt: string
  updatedAt: string
}

// ─── Node Type Metadata ────────────────────────────────────────────────────

export const STEP_TYPE_DEFS: {
  type: WorkflowNodeType
  label: string
  icon: string
  color: string
  bg: string
  description: string
}[] = [
  { type: "trigger", label: "Trigger", icon: "Sparkles", color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/40", description: "Workflow entry point" },
  { type: "send_email", label: "Send Email", icon: "Mail", color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/40", description: "Send an email notification" },
  { type: "notification", label: "Notification", icon: "Bell", color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/40", description: "Create an in-app notification" },
  { type: "webhook", label: "Webhook", icon: "Webhook", color: "text-violet-500", bg: "bg-violet-100 dark:bg-violet-900/40", description: "Call an external API" },
  { type: "delay", label: "Delay", icon: "Timer", color: "text-cyan-500", bg: "bg-cyan-100 dark:bg-cyan-900/40", description: "Wait before next step" },
  { type: "condition", label: "Condition", icon: "GitBranch", color: "text-rose-500", bg: "bg-rose-100 dark:bg-rose-900/40", description: "Branch based on a condition" },
  { type: "trigger_db", label: "Database Action", icon: "Database", color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/40", description: "Create or update database records" },
  { type: "transform", label: "Transform", icon: "Code", color: "text-indigo-500", bg: "bg-indigo-100 dark:bg-indigo-900/40", description: "Transform data with expressions" },
  { type: "log", label: "Log", icon: "FileText", color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-900/40", description: "Log a message to execution output" },
]

export function getStepDef(type: string) {
  return STEP_TYPE_DEFS.find((s) => s.type === type) || STEP_TYPE_DEFS[0]
}
