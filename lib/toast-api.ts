import { toast } from "sonner"

export async function toastApi<T>(
  promise: Promise<T>,
  messages: { loading: string; success: string; error?: string },
): Promise<T> {
  const toastId = toast.loading(messages.loading)
  try {
    const result = await promise
    toast.success(messages.success, { id: toastId })
    return result
  } catch (e) {
    toast.error(messages.error || (e instanceof Error ? e.message : "Something went wrong"), {
      id: toastId,
    })
    throw e
  }
}
