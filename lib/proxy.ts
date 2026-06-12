export class ApiError extends Error {
  status: number
  body: Record<string, unknown> | null

  constructor(message: string, status: number, body?: Record<string, unknown>) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body ?? null
  }
}

export async function api<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData
  const headers = isFormData
    ? (init?.headers as HeadersInit)
    : { "Content-Type": "application/json", ...(init?.headers as Record<string, string>) }
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(
      (body as Record<string, unknown>)?.error as string ?? `Request failed: ${res.status}`,
      res.status,
      body as Record<string, unknown>,
    )
  }

  if (res.status === 204) return undefined as T

  return res.json()
}

export async function apiFormData<T = unknown>(url: string, formData: FormData): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    body: formData,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(
      (body as Record<string, unknown>)?.error as string ?? `Upload failed: ${res.status}`,
      res.status,
      body as Record<string, unknown>,
    )
  }

  return res.json()
}
