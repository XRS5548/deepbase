import { api } from "@/lib/proxy"

export type ActivityItem = {
  id: string
  entity: string
  entityId: string
  action: string
  performedBy: string
  diff: Record<string, unknown> | null
  meta: Record<string, unknown> | null
  createdAt: string
  performerName: string | null
  performerEmail: string | null
}

export function getActivity(): Promise<ActivityItem[]> {
  return api("/api/activity")
}
