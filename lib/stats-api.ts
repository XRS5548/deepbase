async function api<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export type Stats = {
  databases: number
  forms: number
  teams: number
  triggers: number
}

export function getStats(): Promise<Stats> {
  return api("/api/stats")
}
