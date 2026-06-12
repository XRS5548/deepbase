import { NextRequest, NextResponse } from "next/server"
import { getSession, errorResponse } from "@/lib/api-utils"
import { db } from "@/db"
import { formCols, updateLogs } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { requireWritePermission } from "@/lib/form-api-utils"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const { id } = await params
    await requireWritePermission(id, session.user.id)

    const body = await req.json()
    const { name, type = "text", options = null, required = false } = body
    if (!name?.trim()) return errorResponse("Name is required")

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "field"

    const [max] = await db
      .select({ mx: sql<string>`MAX("order")` })
      .from(formCols)
      .where(eq(formCols.formId, id))

    const [col] = await db
      .insert(formCols)
      .values({ formId: id, name: name.trim(), slug, type, options: options as Record<string, unknown> | null, required, order: (Number(max?.mx ?? 0) + 1) })
      .returning()

    await db.insert(updateLogs).values({ entity: "form_col", entityId: col.id, action: "created", performedBy: session.user.id })

    return NextResponse.json({ success: true, column: col })
  } catch (e) {
    return errorResponse(e, 401)
  }
}
