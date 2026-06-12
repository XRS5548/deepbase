import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session
}

export function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Something went wrong"
  return NextResponse.json({ error: message }, { status })
}
