import { api } from "@/lib/proxy"

export type Stats = {
  databases: number
  forms: number
  teams: number
  triggers: number
  workflows: number
}

export function getStats(): Promise<Stats> {
  return api("/api/stats")
}
