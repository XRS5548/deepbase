import { NextRequest, NextResponse } from "next/server"
import { getSession, errorResponse } from "@/lib/api-utils"
import { db } from "@/db"
import { formCols, updateLogs } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireWritePermission } from "@/lib/form-api-utils"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ colId: string }> }) {
  try {
    const session = await getSession()
    const { colId } = await params
    const [col] = await db.select({ formId: formCols.formId }).from(formCols).where(eq(formCols.id, colId))
    if (!col) return errorResponse("Column not found", 404)
    await requireWritePermission(col.formId, session.user.id)

    const body = await req.json()
    await db.update(formCols).set(body).where(eq(formCols.id, colId))
    await db.insert(updateLogs).values({ entity: "form_col", entityId: colId, action: "updated", performedBy: session.user.id })
    return NextResponse.json({ success: true })
  } catch (e) {
    return errorResponse(e, 401)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; colId: string }> }) {
  try {
    const session = await getSession()
    const { colId } = await params
    const [col] = await db.select({ formId: formCols.formId }).from(formCols).where(eq(formCols.id, colId))
    if (!col) return errorResponse("Column not found", 404)
    await requireWritePermission(col.formId, session.user.id)

    await db.delete(formCols).where(eq(formCols.id, colId))
    await db.insert(updateLogs).values({ entity: "form_col", entityId: colId, action: "deleted", performedBy: session.user.id })
    return NextResponse.json({ success: true })
  } catch (e) {
    return errorResponse(e, 401)
  }
}
