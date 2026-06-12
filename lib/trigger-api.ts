import type { TriggerItem } from "@/lib/actions/triggers"
import { toastApi } from "@/lib/toast-api"
import { api } from "@/lib/proxy"

export function getTriggers(): Promise<TriggerItem[]> {
  return api("/api/triggers")
}

export function createTrigger(data: {
  date: string
  time?: string
  message: string
  icon?: string
  bgColor?: string
  teamId?: string
  dbColId?: string
}) {
  return toastApi(
    api<{ success: boolean; trigger: TriggerItem }>("/api/triggers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    { loading: "Creating trigger...", success: "Trigger created!" },
  )
}

export function updateTrigger(
  id: string,
  data: Partial<{ date: string; time: string; message: string; icon: string; bgColor: string; fired: boolean; dbColId: string | null }>,
) {
  return toastApi(
    api<{ success: boolean }>(`/api/triggers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    { loading: "Updating trigger...", success: "Trigger updated!" },
  )
}

export function deleteTrigger(id: string) {
  return toastApi(
    api<{ success: boolean }>(`/api/triggers/${id}`, { method: "DELETE" }),
    { loading: "Deleting trigger...", success: "Trigger deleted" },
  )
}
