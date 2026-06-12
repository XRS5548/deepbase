import { NextRequest, NextResponse } from "next/server"
import { getSession, errorResponse } from "@/lib/api-utils"
import { db } from "@/db"
import { waAccounts } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { waManager } from "@/lib/wa-manager"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; chatId: string }> }) {
  try {
    const session = await getSession()
    const { id, chatId } = await params
    const { message } = await req.json()

    if (!message?.trim()) return errorResponse("Message is required")

    const [account] = await db
      .select()
      .from(waAccounts)
      .where(and(eq(waAccounts.id, id), eq(waAccounts.userId, session.user.id)))
    if (!account) return errorResponse("Account not found", 404)

    await waManager.sendMessage(id, chatId, message.trim())
    return NextResponse.json({ success: true })
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : "Failed to send message")
  }
}
