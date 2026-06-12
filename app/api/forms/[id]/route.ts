import { NextRequest, NextResponse } from "next/server"
import { getSession, errorResponse } from "@/lib/api-utils"
import { db } from "@/db"
import { forms, formCols, userFormAllotments, teams, teamMembers, updateLogs } from "@/db/schema"
import { user } from "@/auth-schema"
import { eq, and, sql } from "drizzle-orm"
import { getUserEffectivePermission } from "@/lib/form-api-utils"
import { pushNotification, pushNotificationToUsers } from "@/lib/notification-utils"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const { id } = await params

    const [f] = await db.select().from(forms).where(eq(forms.id, id))
    if (!f) return errorResponse("Form not found", 404)

    const isOwner = f.createdBy === session.user.id
    if (!isOwner) {
      const perm = await getUserEffectivePermission(id, session.user.id)
      if (!perm) return errorResponse("Forbidden", 403)
    }

    const [cols, allots] = await Promise.all([
      db.select().from(formCols).where(eq(formCols.formId, id)).orderBy(formCols.order),
      db
        .select({
          id: userFormAllotments.id, formId: userFormAllotments.formId,
          permission: userFormAllotments.permission, createdAt: userFormAllotments.createdAt,
          userId: userFormAllotments.userId, teamId: userFormAllotments.teamId,
          userEmail: user.email, userName: user.name, userImage: user.image,
          teamName: teams.name,
        })
        .from(userFormAllotments)
        .leftJoin(user, eq(user.id, userFormAllotments.userId))
        .leftJoin(teams, eq(teams.id, userFormAllotments.teamId))
        .where(eq(userFormAllotments.formId, id))
        .orderBy(userFormAllotments.createdAt),
    ])

    const userTeamIds = (await db
      .select({ id: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, session.user.id))
    ).map((r) => r.id)

    let sharedViaTeams: { id: string; name: string }[] = []
    if (userTeamIds.length > 0) {
      const teamAllots = await db
        .select({ teamId: teams.id, teamName: teams.name })
        .from(userFormAllotments)
        .innerJoin(teams, eq(teams.id, userFormAllotments.teamId))
        .where(and(eq(userFormAllotments.formId, id), sql`${userFormAllotments.teamId} IN (${sql.join(userTeamIds, sql`, `)})`))
      sharedViaTeams = teamAllots.map((a) => ({ id: a.teamId, name: a.teamName }))
    }

    const [directAllot] = await db
      .select({ id: userFormAllotments.id })
      .from(userFormAllotments)
      .where(and(eq(userFormAllotments.formId, id), eq(userFormAllotments.userId, session.user.id)))
      .limit(1)

    return NextResponse.json({
      ...f, columns: cols, allotments: allots, isOwner,
      userPermission: await getUserEffectivePermission(id, session.user.id),
      sharedViaTeams, hasDirectAllotment: !!directAllot,
    })
  } catch (e) {
    return errorResponse(e, 401)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const { id } = await params
    const fd = await req.formData()
    const name = fd.get("name") as string
    const description = fd.get("description") as string | null
    const icon = fd.get("icon") as string | null
    const image = fd.get("image") as string | null
    const isPublic = fd.get("isPublic") === "on"
    const paid = fd.get("paid") === "on"
    const payAmount = fd.get("payAmount") as string | null
    if (!name?.trim()) return errorResponse("Name is required")

    const [f] = await db.select({ createdBy: forms.createdBy }).from(forms).where(eq(forms.id, id))
    if (!f || f.createdBy !== session.user.id) return errorResponse("Forbidden", 403)

    await db
      .update(forms)
      .set({ name: name.trim(), description: description?.trim() || null, icon: icon?.trim() || null, image: image?.trim() || null, isPublic, paid, payAmount: paid ? (payAmount?.trim() || null) : null })
      .where(eq(forms.id, id))

    await db.insert(updateLogs).values({ entity: "form", entityId: id, action: "updated", performedBy: session.user.id })

    return NextResponse.json({ success: true })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const { id } = await params

    const [f] = await db.select({ name: forms.name, createdBy: forms.createdBy }).from(forms).where(eq(forms.id, id))
    if (!f || f.createdBy !== session.user.id) return errorResponse("Forbidden", 403)

    const allotUsers = await db
      .select({ userId: userFormAllotments.userId })
      .from(userFormAllotments)
      .where(and(eq(userFormAllotments.formId, id), sql`${userFormAllotments.userId} IS NOT NULL`))

    await db.delete(forms).where(eq(forms.id, id))

    await db.insert(updateLogs).values({ entity: "form", entityId: id, action: "deleted", performedBy: session.user.id })

    await pushNotification({
      userId: session.user.id,
      title: `Form "${f.name}" deleted`,
      description: `You deleted the form`,
      icon: "FormInput",
    })

    if (allotUsers.length > 0) {
      await pushNotificationToUsers(
        allotUsers.map((a) => ({
          userId: a.userId!,
          title: `Form "${f.name}" deleted`,
          description: `The form you had access to was deleted`,
          icon: "FormInput",
        }))
      )
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return errorResponse(e, 401)
  }
}
