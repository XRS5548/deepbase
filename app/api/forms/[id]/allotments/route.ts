import { NextRequest, NextResponse } from "next/server"
import { getSession, errorResponse } from "@/lib/api-utils"
import { db } from "@/db"
import { forms, userFormAllotments, updateLogs } from "@/db/schema"
import { user } from "@/auth-schema"
import { eq, and } from "drizzle-orm"
import { pushNotification } from "@/lib/notification-utils"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const { id } = await params

    const [f] = await db.select({ name: forms.name, createdBy: forms.createdBy }).from(forms).where(eq(forms.id, id))
    if (!f || f.createdBy !== session.user.id) return errorResponse("Forbidden", 403)

    const body = await req.json()
    const { type, email, teamId, permission } = body

    if (type === "user") {
      if (!email) return errorResponse("Email required")
      const [u] = await db.select().from(user).where(eq(user.email, email))
      if (!u) return errorResponse("User not found", 404)

      const [existing] = await db
        .select()
        .from(userFormAllotments)
        .where(and(eq(userFormAllotments.formId, id), eq(userFormAllotments.userId, u.id)))
      if (existing) return errorResponse("User already has access")

      await db.insert(userFormAllotments).values({ formId: id, userId: u.id, permission })

      await db.insert(updateLogs).values({ entity: "form", entityId: id, action: "shared", performedBy: session.user.id })

      await pushNotification({
        userId: u.id,
        title: `Access to form "${f.name}"`,
        description: `You were given ${permission === "f" ? "full" : permission === "rw" ? "read-write" : "read"} access`,
        icon: "FormInput",
        url: `/dashboard/forms/${id}`,
      })
    } else {
      if (!teamId) return errorResponse("Team required")
      await db.insert(userFormAllotments).values({ formId: id, teamId, permission })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return errorResponse(e, 401)
  }
}
