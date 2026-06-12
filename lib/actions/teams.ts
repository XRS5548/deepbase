"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/db"
import { teams, teamMembers, updateLogs } from "@/db/schema"
import { pushNotification } from "@/lib/notification-utils"
import { user } from "@/auth-schema"
import { eq, desc, and, inArray, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type TeamWithDetails = {
  id: string
  name: string
  description: string | null
  icon: string | null
  image: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
  role: "leader" | "admin" | "member"
  memberCount: number
}

export async function getUserTeams(): Promise<TeamWithDetails[]> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const userId = session.user.id

  const userTeams = await db
    .select({
      id: teams.id,
      name: teams.name,
      description: teams.description,
      icon: teams.icon,
      image: teams.image,
      createdBy: teams.createdBy,
      createdAt: teams.createdAt,
      updatedAt: teams.updatedAt,
      role: teamMembers.role,
    })
    .from(teams)
    .innerJoin(teamMembers, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, userId))
    .orderBy(desc(teams.createdAt))

  if (userTeams.length === 0) return []

  const teamIds = userTeams.map((t) => t.id)
  const counts = await db
    .select({
      teamId: teamMembers.teamId,
      count: sql<string>`COUNT(*)::int`,
    })
    .from(teamMembers)
    .where(inArray(teamMembers.teamId, teamIds))
    .groupBy(teamMembers.teamId)

  const countMap = new Map(counts.map((c) => [c.teamId, Number(c.count)]))

  return userTeams.map((t) => ({
    ...t,
    memberCount: countMap.get(t.id) ?? 1,
  }))
}

export async function createTeam(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const name = formData.get("name") as string
  const description = formData.get("description") as string | null
  const icon = formData.get("icon") as string | null
  if (!name?.trim()) throw new Error("Team name is required")

  const [team] = await db
    .insert(teams)
    .values({
      name: name.trim(),
      description: description?.trim() || null,
      icon: icon?.trim() || null,
      createdBy: session.user.id,
    })
    .returning()

  await db.insert(teamMembers).values({ teamId: team.id, userId: session.user.id, role: "leader" })

  await db.insert(updateLogs).values({
    entity: "team",
    entityId: team.id,
    action: "created",
    performedBy: session.user.id,
  })

  await pushNotification({
    userId: session.user.id,
    title: `Team "${team.name}" created`,
    description: `You created a new team`,
    icon: "Users",
    url: `/dashboard/teams/${team.id}`,
  })

  revalidatePath("/dashboard/teams")
  return { success: true, team: { ...team, role: "leader" as const, memberCount: 1 } }
}

export async function deleteTeam(teamId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const [team] = await db.select({ createdBy: teams.createdBy }).from(teams).where(eq(teams.id, teamId))
  if (!team || team.createdBy !== session.user.id) throw new Error("Forbidden")

  await db.delete(teams).where(eq(teams.id, teamId))
  await db.insert(updateLogs).values({ entity: "team", entityId: teamId, action: "deleted", performedBy: session.user.id })
  revalidatePath("/dashboard/teams")
  return { success: true }
}

export async function leaveTeam(teamId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  await db.delete(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, session.user.id)))
  await db.insert(updateLogs).values({ entity: "team_member", entityId: teamId, action: "deleted", performedBy: session.user.id })
  revalidatePath("/dashboard/teams")
  return { success: true }
}

// ─── Team detail ──────────────────────────────────────────────────

export type TeamMember = {
  id: string
  userId: string
  name: string
  email: string
  image: string | null
  role: "leader" | "admin" | "member"
  joinedAt: Date
}

export type TeamDetail = {
  id: string
  name: string
  description: string | null
  icon: string | null
  image: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
  members: TeamMember[]
  currentUserRole: "leader" | "admin" | "member" | null
}

export async function getTeamWithMembers(teamId: string): Promise<TeamDetail> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const [team] = await db.select().from(teams).where(eq(teams.id, teamId))
  if (!team) throw new Error("Team not found")

  const members = await db
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      name: user.name,
      email: user.email,
      image: user.image,
      role: teamMembers.role,
      joinedAt: teamMembers.joinedAt,
    })
    .from(teamMembers)
    .innerJoin(user, eq(user.id, teamMembers.userId))
    .where(eq(teamMembers.teamId, teamId))
    .orderBy(teamMembers.role, teamMembers.joinedAt)

  const currentMember = members.find((m) => m.userId === session.user.id)
  const roleOrder = { leader: 0, admin: 1, member: 2 }

  return {
    ...team,
    members: members.sort((a, b) => (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3)),
    currentUserRole: currentMember?.role ?? null,
  }
}

export async function updateTeam(teamId: string, formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const name = formData.get("name") as string
  const description = formData.get("description") as string | null
  const icon = formData.get("icon") as string | null
  const image = formData.get("image") as string | null
  if (!name?.trim()) throw new Error("Team name is required")

  const [membership] = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, session.user.id)))
  if (!membership || (membership.role !== "leader" && membership.role !== "admin"))
    throw new Error("Forbidden")

  await db
    .update(teams)
    .set({
      name: name.trim(),
      description: description?.trim() || null,
      icon: icon?.trim() || null,
      image: image?.trim() || null,
    })
    .where(eq(teams.id, teamId))

  await db.insert(updateLogs).values({
    entity: "team",
    entityId: teamId,
    action: "updated",
    performedBy: session.user.id,
  })

  revalidatePath(`/dashboard/teams/${teamId}`)
  revalidatePath("/dashboard/teams")
  return { success: true }
}

export async function addMember(teamId: string, email: string, role: "leader" | "admin" | "member" = "member") {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const [membership] = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, session.user.id)))
  if (!membership || (membership.role !== "leader" && membership.role !== "admin"))
    throw new Error("Forbidden")

  const [[team], [targetUser]] = await Promise.all([
    db.select({ name: teams.name }).from(teams).where(eq(teams.id, teamId)),
    db.select().from(user).where(eq(user.email, email)),
  ])
  if (!team) throw new Error("Team not found")
  if (!targetUser) throw new Error("User not found with this email")

  const [existing] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, targetUser.id)))
  if (existing) throw new Error("User is already a member")

  await db.insert(teamMembers).values({ teamId, userId: targetUser.id, role })

  await db.insert(updateLogs).values({ entity: "team_member", entityId: teamId, action: "created", performedBy: session.user.id })

  await pushNotification({
    userId: targetUser.id,
    title: `Added to team "${team.name}"`,
    description: `You were added as ${role}`,
    icon: "Users",
    url: `/dashboard/teams/${teamId}`,
  })
  revalidatePath(`/dashboard/teams/${teamId}`)
  revalidatePath("/dashboard/teams")
  return { success: true, member: { id: targetUser.id, name: targetUser.name, email: targetUser.email, image: targetUser.image, role } }
}

export async function updateMemberRole(teamId: string, memberUserId: string, newRole: "leader" | "admin" | "member") {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const [membership] = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, session.user.id)))
  if (!membership || membership.role !== "leader") throw new Error("Forbidden")

  await db
    .update(teamMembers)
    .set({ role: newRole })
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, memberUserId)))

  await db.insert(updateLogs).values({ entity: "team_member", entityId: teamId, action: "permission_changed", performedBy: session.user.id })

  const [[team], [targetUser]] = await Promise.all([
    db.select({ name: teams.name }).from(teams).where(eq(teams.id, teamId)),
    db.select({ name: user.name }).from(user).where(eq(user.id, session.user.id)),
  ])

  await pushNotification({
    userId: memberUserId,
    title: `Role updated in "${team?.name || "Team"}"`,
    description: `Your role was changed to ${newRole} by ${targetUser?.name || "a team admin"}`,
    icon: "Users",
    url: `/dashboard/teams/${teamId}`,
  })

  revalidatePath(`/dashboard/teams/${teamId}`)
  return { success: true }
}

export async function removeMember(teamId: string, memberUserId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const [membership] = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, session.user.id)))
  if (!membership || (membership.role !== "leader" && membership.role !== "admin"))
    throw new Error("Forbidden")

  const [targetMember] = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, memberUserId)))
  if (!targetMember) throw new Error("Member not found")

  if (targetMember.role === "leader") throw new Error("Cannot remove the leader")
  if (membership.role === "admin" && targetMember.role === "admin") throw new Error("Admins cannot remove other admins")

  await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, memberUserId)))

  await db.insert(updateLogs).values({ entity: "team_member", entityId: teamId, action: "deleted", performedBy: session.user.id })

  const [team] = await db.select({ name: teams.name }).from(teams).where(eq(teams.id, teamId))

  await pushNotification({
    userId: memberUserId,
    title: `Removed from team "${team?.name || "Team"}"`,
    description: `You were removed from the team`,
    icon: "Users",
  })

  revalidatePath(`/dashboard/teams/${teamId}`)
  revalidatePath("/dashboard/teams")
  return { success: true }
}
