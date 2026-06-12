import { NextRequest, NextResponse } from "next/server"
import { getSession, errorResponse } from "@/lib/api-utils"
import { db } from "@/db"
import { forms, userFormAllotments, updateLogs } from "@/db/schema"
import { eq } from "drizzle-orm"
import { pushNotification } from "@/lib/notification-utils"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; allotId: string }> }) {
  try {
    const session = await getSession()
    const { allotId } = await params
    const body = await req.json()
    const { permission } = body

    const [a] = await db.select({ formId: userFormAllotments.formId, userId: userFormAllotments.userId }).from(userFormAllotments).where(eq(userFormAllotments.id, allotId))
    if (!a) return errorResponse("Allotment not found", 404)

    const [f] = await db.select({ name: forms.name, createdBy: forms.createdBy }).from(forms).where(eq(forms.id, a.formId))
    if (!f || f.createdBy !== session.user.id) return errorResponse("Forbidden", 403)

    await db.update(userFormAllotments).set({ permission }).where(eq(userFormAllotments.id, allotId))

    await db.insert(updateLogs).values({ entity: "form", entityId: allotId, action: "permission_changed", performedBy: session.user.id })

    if (a.userId) {
      await pushNotification({
        userId: a.userId,
        title: `Access updated for "${f.name}"`,
        description: `Your permission was changed to ${permission === "f" ? "full" : permission === "rw" ? "read-write" : "read"}`,
        icon: "FormInput",
        url: `/dashboard/forms/${a.formId}`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return errorResponse(e, 401)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; allotId: string }> }) {
  try {
    const session = await getSession()
    const { allotId } = await params

    const [a] = await db.select({ formId: userFormAllotments.formId, userId: userFormAllotments.userId }).from(userFormAllotments).where(eq(userFormAllotments.id, allotId))
    if (!a) return errorResponse("Allotment not found", 404)

    const [f] = await db.select({ name: forms.name, createdBy: forms.createdBy }).from(forms).where(eq(forms.id, a.formId))
    if (!f || f.createdBy !== session.user.id) return errorResponse("Forbidden", 403)

    await db.delete(userFormAllotments).where(eq(userFormAllotments.id, allotId))

    await db.insert(updateLogs).values({ entity: "form", entityId: allotId, action: "deleted", performedBy: session.user.id })

    if (a.userId) {
      await pushNotification({
        userId: a.userId,
        title: `Access removed for "${f.name}"`,
        description: `Your access was removed`,
        icon: "FormInput",
      })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return errorResponse(e, 401)
  }
}
