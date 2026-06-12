import { NextRequest, NextResponse } from "next/server"
import { getSession, errorResponse } from "@/lib/api-utils"
import { db } from "@/db"
import { waAccounts } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { waManager } from "@/lib/wa-manager"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const { id } = await params

    const [account] = await db
      .select()
      .from(waAccounts)
      .where(and(eq(waAccounts.id, id), eq(waAccounts.userId, session.user.id)))

    if (!account) return errorResponse("Account not found", 404)
    return NextResponse.json(account)
  } catch (e) {
    return errorResponse(e, 401)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const { id } = await params
    const { name } = await req.json()

    const [existing] = await db
      .select()
      .from(waAccounts)
      .where(and(eq(waAccounts.id, id), eq(waAccounts.userId, session.user.id)))
    if (!existing) return errorResponse("Account not found", 404)

    const [updated] = await db
      .update(waAccounts)
      .set({ name: name?.trim() ?? existing.name, updatedAt: new Date() })
      .where(eq(waAccounts.id, id))
      .returning()

    return NextResponse.json({ success: true, account: updated })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const { id } = await params

    const [existing] = await db
      .select()
      .from(waAccounts)
      .where(and(eq(waAccounts.id, id), eq(waAccounts.userId, session.user.id)))
    if (!existing) return errorResponse("Account not found", 404)

    await waManager.disconnect(id)
    await db.delete(waAccounts).where(eq(waAccounts.id, id))

    return NextResponse.json({ success: true })
  } catch (e) {
    return errorResponse(e, 401)
  }
}
