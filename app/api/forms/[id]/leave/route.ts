import { NextRequest, NextResponse } from "next/server"
import { getSession, errorResponse } from "@/lib/api-utils"
import { db } from "@/db"
import { forms, userFormAllotments, updateLogs } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const { id } = await params

    const [f] = await db.select({ createdBy: forms.createdBy }).from(forms).where(eq(forms.id, id))
    if (!f) return errorResponse("Form not found", 404)
    if (f.createdBy === session.user.id) return errorResponse("Owner cannot leave; delete the form instead")

    await db
      .delete(userFormAllotments)
      .where(and(eq(userFormAllotments.formId, id), eq(userFormAllotments.userId, session.user.id)))

    await db.insert(updateLogs).values({ entity: "form", entityId: id, action: "updated", performedBy: session.user.id })

    return NextResponse.json({ success: true })
  } catch (e) {
    return errorResponse(e, 401)
  }
}
