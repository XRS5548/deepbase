import { toastApi } from "@/lib/toast-api"
import { api } from "@/lib/proxy"

export type NotificationItem = {
  id: string
  userId: string
  title: string
  description: string | null
  icon: string | null
  url: string | null
  buttonText: string | null
  read: boolean
  createdAt: string
}

export function getNotifications(): Promise<NotificationItem[]> {
  return api("/api/notifications")
}

export function markRead(id: string, read: boolean) {
  return toastApi(
    api<{ success: boolean }>(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read }),
    }),
    { loading: "Updating...", success: "" },
  )
}

export function deleteNotification(id: string) {
  return toastApi(
    api<{ success: boolean }>(`/api/notifications/${id}`, { method: "DELETE" }),
    { loading: "Deleting...", success: "Deleted" },
  )
}

export function markAllRead() {
  return toastApi(
    api<{ success: boolean }>("/api/notifications", { method: "POST" }),
    { loading: "Marking all as read...", success: "All marked as read" },
  )
}
