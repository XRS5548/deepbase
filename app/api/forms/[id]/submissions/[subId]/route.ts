import { NextRequest, NextResponse } from "next/server"
import { getSession, errorResponse } from "@/lib/api-utils"
import { db } from "@/db"
import { formSubmissions, updateLogs } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireWritePermission } from "@/lib/form-api-utils"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; subId: string }> }) {
  try {
    const session = await getSession()
    const { subId } = await params
    const [s] = await db.select({ formId: formSubmissions.formId }).from(formSubmissions).where(eq(formSubmissions.id, subId))
    if (!s) return errorResponse("Submission not found", 404)
    await requireWritePermission(s.formId, session.user.id)

    await db.delete(formSubmissions).where(eq(formSubmissions.id, subId))
    await db.insert(updateLogs).values({ entity: "form_submission", entityId: subId, action: "deleted", performedBy: session.user.id })
    return NextResponse.json({ success: true })
  } catch (e) {
    return errorResponse(e, 401)
  }
}
