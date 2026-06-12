import { toastApi } from "@/lib/toast-api"
import { api } from "@/lib/proxy"
import type { WorkflowItem, WorkflowFlowNode, WorkflowFlowEdge, EmailAccount } from "@/lib/workflow-types"

export type { WorkflowItem, WorkflowStep } from "@/lib/workflow-types"
export type { WorkflowFlowNode, WorkflowFlowEdge, EmailAccount } from "@/lib/workflow-types"

export function getWorkflows(): Promise<WorkflowItem[]> {
  return api("/api/workflows")
}

export function createWorkflow(data: {
  name: string
  description?: string
  icon?: string
  bgColor?: string
}) {
  return toastApi(
    api<{ success: boolean; workflow: WorkflowItem }>("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    { loading: "Creating workflow...", success: "Workflow created!" },
  )
}

export function updateWorkflow(
  id: string,
  data: Partial<{
    name: string
    description: string
    icon: string
    bgColor: string
    steps: unknown[]
    nodes: WorkflowFlowNode[]
    edges: WorkflowFlowEdge[]
    webhookSecret: string
    isActive: boolean
  }>,
) {
  return toastApi(
    api<{ success: boolean }>(`/api/workflows/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    { loading: "Updating workflow...", success: "Workflow updated!" },
  )
}

export function deleteWorkflow(id: string) {
  return toastApi(
    api<{ success: boolean }>(`/api/workflows/${id}`, { method: "DELETE" }),
    { loading: "Deleting workflow...", success: "Workflow deleted" },
  )
}

export function getWorkflowFireUrl(secret: string): string {
  if (typeof window === "undefined") return ""
  const base = window.location.origin
  return `${base}/api/workflows/fire/${secret}`
}

export function getWorkflowFireEndpoint(secret: string): string {
  return `/api/workflows/fire/${secret}`
}

export function fetchEmailAccounts(): Promise<EmailAccount[]> {
  return api("/api/email/accounts")
}

export function executeWorkflow(webhookSecret: string, body?: unknown) {
  return api<{ success: boolean; status: string; stepsLog: unknown[]; error?: string | null }>(
    getWorkflowFireEndpoint(webhookSecret),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    },
  )
}

export function getWorkflowExecutions(id: string) {
  return api<{ executions: unknown[] }>(`/api/workflows/${id}/executions`)
}
