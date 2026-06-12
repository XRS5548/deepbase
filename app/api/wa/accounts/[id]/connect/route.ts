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

    const [account] = await db
      .select()
      .from(waAccounts)
      .where(and(eq(waAccounts.id, id), eq(waAccounts.userId, session.user.id)))
    if (!account) return errorResponse("Account not found", 404)

    const result = await waManager.connect(id)

    if (result.type === "qr") {
      await db.update(waAccounts).set({ status: "connecting", updatedAt: new Date() }).where(eq(waAccounts.id, id))
    }

    return NextResponse.json(result)
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : "Connection failed")
  }
}
