import { NextRequest, NextResponse } from "next/server"
import { getSession, errorResponse } from "@/lib/api-utils"
import { db } from "@/db"
import { forms, formCols, formSubmissions, userFormAllotments, teams, teamMembers, updateLogs } from "@/db/schema"
import { eq, desc, and, or, sql } from "drizzle-orm"
import { pushNotification } from "@/lib/notification-utils"

export async function GET() {
  try {
    const session = await getSession()

    const userTeamIds = (await db
      .select({ id: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, session.user.id))
    ).map((r) => r.id)

    const rows = await db
      .select({
        id: forms.id, name: forms.name, description: forms.description,
        icon: forms.icon, image: forms.image, isPublic: forms.isPublic,
        paid: forms.paid, payAmount: forms.payAmount, createdBy: forms.createdBy,
        createdAt: forms.createdAt, updatedAt: forms.updatedAt,
      })
      .from(forms)
      .where(
        or(
          eq(forms.createdBy, session.user.id),
          sql`${forms.id} IN (SELECT ${userFormAllotments.formId} FROM ${userFormAllotments} WHERE ${userFormAllotments.userId} = ${session.user.id})`,
          userTeamIds.length > 0
            ? sql`${forms.id} IN (SELECT ${userFormAllotments.formId} FROM ${userFormAllotments} WHERE ${userFormAllotments.teamId} IN (${sql.join(userTeamIds, sql`, `)}))`
            : sql`1=0`
        )
      )
      .orderBy(desc(forms.createdAt))

    const formIds = rows.map((r) => r.id)
    const countMap: Record<string, { fieldCount: number; submissionCount: number }> = {}
    if (formIds.length > 0) {
      const [fieldCounts, submissionCounts] = await Promise.all([
        db
          .select({ formId: formCols.formId, count: sql<number>`COUNT(*)::int` })
          .from(formCols)
          .where(sql`${formCols.formId} IN (${sql.join(formIds, sql`, `)})`)
          .groupBy(formCols.formId),
        db
          .select({ formId: formSubmissions.formId, count: sql<number>`COUNT(*)::int` })
          .from(formSubmissions)
          .where(sql`${formSubmissions.formId} IN (${sql.join(formIds, sql`, `)})`)
          .groupBy(formSubmissions.formId),
      ])
      const fcMap: Record<string, number> = {}
      for (const f of fieldCounts) fcMap[f.formId] = f.count
      const scMap: Record<string, number> = {}
      for (const s of submissionCounts) scMap[s.formId] = s.count
      for (const id of formIds) {
        countMap[id] = { fieldCount: fcMap[id] ?? 0, submissionCount: scMap[id] ?? 0 }
      }
    }

    const teamMap: Record<string, { id: string; name: string }[]> = {}
    let directFormIds = new Set<string>()
    if (formIds.length > 0) {
      const [teamAllots, directAllots] = await Promise.all([
        userTeamIds.length > 0
          ? db
              .select({ formId: userFormAllotments.formId, teamId: teams.id, teamName: teams.name })
              .from(userFormAllotments)
              .innerJoin(teams, eq(teams.id, userFormAllotments.teamId))
              .where(
                and(
                  sql`${userFormAllotments.formId} IN (${sql.join(formIds, sql`, `)})`,
                  sql`${userFormAllotments.teamId} IN (${sql.join(userTeamIds, sql`, `)})`
                )
              )
          : [],
        db
          .select({ formId: userFormAllotments.formId })
          .from(userFormAllotments)
          .where(
            and(
              sql`${userFormAllotments.formId} IN (${sql.join(formIds, sql`, `)})`,
              eq(userFormAllotments.userId, session.user.id)
            )
          ),
      ])
      for (const a of teamAllots) {
        if (!teamMap[a.formId]) teamMap[a.formId] = []
        teamMap[a.formId].push({ id: a.teamId, name: a.teamName })
      }
      directFormIds = new Set(directAllots.map((a) => a.formId))
    }

    const currentUserId = session.user.id
    const result = rows.map((r) => ({
      ...r,
      ...(countMap[r.id] ?? { fieldCount: 0, submissionCount: 0 }),
      sharedViaTeams: teamMap[r.id] || [],
      isOwner: r.createdBy === currentUserId,
      hasDirectAllotment: directFormIds.has(r.id),
    }))
    return NextResponse.json(result)
  } catch (e) {
    return errorResponse(e, 401)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    const fd = await req.formData()
    const name = fd.get("name") as string
    const description = fd.get("description") as string | null
    const icon = fd.get("icon") as string | null
    const image = fd.get("image") as string | null
    if (!name?.trim()) return errorResponse("Name is required")

    const [f] = await db
      .insert(forms)
      .values({ name: name.trim(), description: description?.trim() || null, icon: icon?.trim() || null, image: image?.trim() || null, createdBy: session.user.id })
      .returning()

    await pushNotification({
      userId: session.user.id,
      title: `Form "${f.name}" created`,
      description: `You created a new form`,
      icon: "FormInput",
      url: `/dashboard/forms/${f.id}`,
    })

    await db.insert(updateLogs).values({ entity: "form", entityId: f.id, action: "created", performedBy: session.user.id })

    return NextResponse.json({ success: true, form: { ...f, fieldCount: 0, submissionCount: 0, sharedViaTeams: [], isOwner: true, hasDirectAllotment: false } })
  } catch (e) {
    return errorResponse(e)
  }
}
