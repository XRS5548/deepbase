import { NextRequest, NextResponse } from "next/server"
import { getSession, errorResponse } from "@/lib/api-utils"
import { db } from "@/db"
import { dateTriggers } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const { id } = await params
    const body = await req.json()

    const [t] = await db.select({ createdBy: dateTriggers.createdBy }).from(dateTriggers).where(eq(dateTriggers.id, id))
    if (!t) return errorResponse("Trigger not found", 404)
    if (t.createdBy !== session.user.id) return errorResponse("Forbidden", 403)

    const updateData: Record<string, unknown> = {}
    if (body.date !== undefined) updateData.date = new Date(body.date)
    if (body.time !== undefined) updateData.time = body.time || null
    if (body.message !== undefined) updateData.message = body.message.trim()
    if (body.icon !== undefined) updateData.icon = body.icon?.trim() || null
    if (body.bgColor !== undefined) updateData.bgColor = body.bgColor || null
    if (body.fired !== undefined) updateData.fired = body.fired
    if (body.dbColId !== undefined) updateData.dbColId = body.dbColId || null

    await db.update(dateTriggers).set(updateData).where(eq(dateTriggers.id, id))
    return NextResponse.json({ success: true })
  } catch (e) {
    return errorResponse(e, 401)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const { id } = await params

    const [t] = await db.select({ createdBy: dateTriggers.createdBy }).from(dateTriggers).where(eq(dateTriggers.id, id))
    if (!t) return errorResponse("Trigger not found", 404)
    if (t.createdBy !== session.user.id) return errorResponse("Forbidden", 403)

    await db.delete(dateTriggers).where(eq(dateTriggers.id, id))
    return NextResponse.json({ success: true })
  } catch (e) {
    return errorResponse(e, 401)
  }
}
