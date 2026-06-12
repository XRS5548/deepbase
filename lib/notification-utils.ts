import { db } from "@/db"
import { notifications } from "@/db/schema"

type NotificationInput = {
  userId: string
  title: string
  description?: string
  icon?: string
  url?: string
  buttonText?: string
}

export async function pushNotification(input: NotificationInput) {
  await db.insert(notifications).values({
    userId: input.userId,
    title: input.title,
    description: input.description ?? null,
    icon: input.icon ?? null,
    url: input.url ?? null,
    buttonText: input.buttonText ?? null,
    read: false,
  })
}

export async function pushNotificationToUsers(inputs: NotificationInput[]) {
  if (inputs.length === 0) return
  await db.insert(notifications).values(
    inputs.map((input) => ({
      userId: input.userId,
      title: input.title,
      description: input.description ?? null,
      icon: input.icon ?? null,
      url: input.url ?? null,
      buttonText: input.buttonText ?? null,
      read: false,
    }))
  )
}
