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

async function api<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export function getActivity(): Promise<ActivityItem[]> {
  return api("/api/activity")
}
