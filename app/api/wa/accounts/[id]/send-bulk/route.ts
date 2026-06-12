import { NextRequest, NextResponse } from "next/server"
import { getSession, errorResponse } from "@/lib/api-utils"
import { db } from "@/db"
import { waAccounts } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { waManager } from "@/lib/wa-manager"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const { id } = await params
    const { recipients, message } = await req.json()

    if (!message?.trim()) return errorResponse("Message is required")
    if (!Array.isArray(recipients) || recipients.length === 0) return errorResponse("Recipients are required")
    if (recipients.length > 7) return errorResponse("Maximum 7 recipients allowed")

    const [account] = await db
      .select()
      .from(waAccounts)
      .where(and(eq(waAccounts.id, id), eq(waAccounts.userId, session.user.id)))
    if (!account) return errorResponse("Account not found", 404)

    const results = await waManager.sendBulk(id, recipients, message.trim())
    const sent = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return NextResponse.json({ success: true, sent, failed, results })
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : "Failed to send bulk messages")
  }
}
