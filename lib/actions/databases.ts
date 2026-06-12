"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/db"
import { databases, dbCols, dbValues, userDbAllotments, teams, teamMembers, updateLogs } from "@/db/schema"
import { pushNotification, pushNotificationToUsers } from "@/lib/notification-utils"
import { user } from "@/auth-schema"
import { eq, desc, and, or, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

async function logActivity(entity: typeof updateLogs.$inferInsert["entity"], entityId: string, action: typeof updateLogs.$inferInsert["action"], performedBy: string) {
  await db.insert(updateLogs).values({ entity, entityId, action, performedBy })
}

// ─── Types ────────────────────────────────────────────────────────

export type DatabaseWithMeta = {
  id: string
  name: string
  description: string | null
  icon: string | null
  image: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
  fieldCount: number
  rowCount: number
  sharedViaTeams: { id: string; name: string }[]
  isOwner: boolean
  hasDirectAllotment: boolean
}

export type ColumnDef = {
  id: string
  dbId: string
  name: string
  slug: string
  type: string
  bgColor: string | null
  icon: string | null
  order: number | null
}

export type RecordRow = {
  id: string
  dbId: string
  values: Record<string, unknown>
  bgColor: string | null
  starred: boolean
  submittedBy: string
  createdAt: Date
  updatedAt: Date
}

export type AllotmentWithDetails = {
  id: string
  dbId: string
  permission: "f" | "rw" | "r"
  icon: string | null
  createdAt: Date
  userId: string | null
  teamId: string | null
  userEmail: string | null
  userName: string | null
  userImage: string | null
  teamName: string | null
}

export type DatabaseDetail = {
  id: string
  name: string
  description: string | null
  icon: string | null
  image: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
  columns: ColumnDef[]
  allotments: AllotmentWithDetails[]
  isOwner: boolean
  userPermission: "f" | "rw" | "r" | null
  sharedViaTeams: { id: string; name: string }[]
  hasDirectAllotment: boolean
}

export type SimpleTeam = { id: string; name: string }

// ─── Database CRUD ────────────────────────────────────────────────

export async function getUserDatabases(): Promise<DatabaseWithMeta[]> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const userTeamIds = (
    await db
      .select({ id: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, session.user.id))
  ).map((r) => r.id)

  const rows = await db
    .select({
      id: databases.id,
      name: databases.name,
      description: databases.description,
      icon: databases.icon,
      image: databases.image,
      createdBy: databases.createdBy,
      createdAt: databases.createdAt,
      updatedAt: databases.updatedAt,
    })
    .from(databases)
    .where(
      or(
        eq(databases.createdBy, session.user.id),
        sql`${databases.id} IN (SELECT ${userDbAllotments.dbId} FROM ${userDbAllotments} WHERE ${userDbAllotments.userId} = ${session.user.id})`,
        userTeamIds.length > 0
          ? sql`${databases.id} IN (SELECT ${userDbAllotments.dbId} FROM ${userDbAllotments} WHERE ${userDbAllotments.teamId} IN (${sql.join(userTeamIds, sql`, `)}))`
          : sql`1=0`
      )
    )
    .orderBy(desc(databases.createdAt))

  // Fetch counts separately
  const dbIds = rows.map((r) => r.id)
  let countMap: Record<string, { fieldCount: number; rowCount: number }> = {}
  if (dbIds.length > 0) {
    const [fieldCounts, rowCounts] = await Promise.all([
      db
        .select({
          dbId: dbCols.dbId,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(dbCols)
        .where(sql`${dbCols.dbId} IN (${sql.join(dbIds, sql`, `)})`)
        .groupBy(dbCols.dbId),
      db
        .select({
          dbId: dbValues.dbId,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(dbValues)
        .where(sql`${dbValues.dbId} IN (${sql.join(dbIds, sql`, `)})`)
        .groupBy(dbValues.dbId),
    ])
    const fcMap: Record<string, number> = {}
    for (const f of fieldCounts) fcMap[f.dbId] = f.count
    const rcMap: Record<string, number> = {}
    for (const r of rowCounts) rcMap[r.dbId] = r.count
    countMap = {}
    for (const id of dbIds) {
      countMap[id] = { fieldCount: fcMap[id] ?? 0, rowCount: rcMap[id] ?? 0 }
    }
  }

  let teamMap: Record<string, { id: string; name: string }[]> = {}
  let directDbIds = new Set<string>()
  if (dbIds.length > 0) {
    const [teamAllots, directAllots] = await Promise.all([
      userTeamIds.length > 0
        ? db
            .select({
              dbId: userDbAllotments.dbId,
              teamId: teams.id,
              teamName: teams.name,
            })
            .from(userDbAllotments)
            .innerJoin(teams, eq(teams.id, userDbAllotments.teamId))
            .where(
              and(
                sql`${userDbAllotments.dbId} IN (${sql.join(dbIds, sql`, `)})`,
                sql`${userDbAllotments.teamId} IN (${sql.join(userTeamIds, sql`, `)})`
              )
            )
        : [],
      db
        .select({ dbId: userDbAllotments.dbId })
        .from(userDbAllotments)
        .where(
          and(
            sql`${userDbAllotments.dbId} IN (${sql.join(dbIds, sql`, `)})`,
            eq(userDbAllotments.userId, session.user.id)
          )
        ),
    ])

    teamMap = {}
    for (const a of teamAllots) {
      if (!teamMap[a.dbId]) teamMap[a.dbId] = []
      teamMap[a.dbId].push({ id: a.teamId, name: a.teamName })
    }
    directDbIds = new Set(directAllots.map((a) => a.dbId))
  }

  const currentUserId = session.user.id
  return rows.map((r) => ({
    ...r,
    ...(countMap[r.id] ?? { fieldCount: 0, rowCount: 0 }),
    sharedViaTeams: teamMap[r.id] || [],
    isOwner: r.createdBy === currentUserId,
    hasDirectAllotment: directDbIds.has(r.id),
  }))
}

export async function createDatabase(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const name = formData.get("name") as string
  const description = formData.get("description") as string | null
  const icon = formData.get("icon") as string | null
  const image = formData.get("image") as string | null
  if (!name?.trim()) throw new Error("Name is required")

  const [db_] = await db
    .insert(databases)
    .values({ name: name.trim(), description: description?.trim() || null, icon: icon?.trim() || null, image: image?.trim() || null, createdBy: session.user.id })
    .returning()

  await Promise.all([
    logActivity("database", db_.id, "created", session.user.id),
    pushNotification({
      userId: session.user.id,
      title: `Database "${db_.name}" created`,
      description: `You created a new database`,
      icon: "Database",
      url: `/dashboard/databases/${db_.id}`,
    }),
  ])

  revalidatePath("/dashboard/databases")
  return { success: true, database: { ...db_, fieldCount: 0, rowCount: 0, sharedViaTeams: [], isOwner: true, hasDirectAllotment: false } }
}

export async function deleteDatabase(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const [db_] = await db.select({ name: databases.name, createdBy: databases.createdBy }).from(databases).where(eq(databases.id, id))
  if (!db_ || db_.createdBy !== session.user.id) throw new Error("Forbidden")

  const allotUsers = await db
    .select({ userId: userDbAllotments.userId })
    .from(userDbAllotments)
    .where(and(eq(userDbAllotments.dbId, id), sql`${userDbAllotments.userId} IS NOT NULL`))

  await db.delete(databases).where(eq(databases.id, id))

  await logActivity("database", id, "deleted", session.user.id)

  await pushNotification({
    userId: session.user.id,
    title: `Database "${db_.name}" deleted`,
    description: `You deleted the database`,
    icon: "Database",
  })

  if (allotUsers.length > 0) {
    await pushNotificationToUsers(
      allotUsers.map((a) => ({
        userId: a.userId!,
        title: `Database "${db_.name}" deleted`,
        description: `The database you had access to was deleted`,
        icon: "Database",
      }))
    )
  }

  revalidatePath("/dashboard/databases")
  return { success: true }
}

export async function leaveDatabase(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const [db_] = await db.select({ createdBy: databases.createdBy }).from(databases).where(eq(databases.id, id))
  if (!db_) throw new Error("Database not found")
  if (db_.createdBy === session.user.id) throw new Error("Owner cannot leave; delete the database instead")

  await db
    .delete(userDbAllotments)
    .where(and(eq(userDbAllotments.dbId, id), eq(userDbAllotments.userId, session.user.id)))

  await logActivity("database", id, "updated", session.user.id)
  revalidatePath("/dashboard/databases")
  return { success: true }
}

async function getUserEffectivePermission(dbId: string, sessionUserId: string): Promise<"f" | "rw" | "r" | null> {
  const userTeamIds = (
    await db
      .select({ id: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, sessionUserId))
  ).map((r) => r.id)

  const allots = await db
    .select({ permission: userDbAllotments.permission })
    .from(userDbAllotments)
    .where(
      and(
        eq(userDbAllotments.dbId, dbId),
        or(
          eq(userDbAllotments.userId, sessionUserId),
          userTeamIds.length > 0
            ? sql`${userDbAllotments.teamId} IN (${sql.join(userTeamIds, sql`, `)})`
            : sql`1=0`
        )
      )
    )

  const rank: Record<string, number> = { f: 3, rw: 2, r: 1 }
  let best: "f" | "rw" | "r" | null = null
  for (const a of allots) {
    if (!best || rank[a.permission] > rank[best]) best = a.permission
  }
  return best
}

// ─── Database Detail ──────────────────────────────────────────────

export async function getDatabase(id: string): Promise<DatabaseDetail> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const [db_] = await db.select().from(databases).where(eq(databases.id, id))
  if (!db_) throw new Error("Database not found")

  const isOwner = db_.createdBy === session.user.id
  if (!isOwner) {
    const perm = await getUserEffectivePermission(id, session.user.id)
    if (!perm) throw new Error("Forbidden")
  }

  const [cols, allots] = await Promise.all([
    db.select().from(dbCols).where(eq(dbCols.dbId, id)).orderBy(dbCols.order),
    db
      .select({
        id: userDbAllotments.id,
        dbId: userDbAllotments.dbId,
        permission: userDbAllotments.permission,
        icon: userDbAllotments.icon,
        createdAt: userDbAllotments.createdAt,
        userId: userDbAllotments.userId,
        teamId: userDbAllotments.teamId,
        userEmail: user.email,
        userName: user.name,
        userImage: user.image,
        teamName: teams.name,
      })
      .from(userDbAllotments)
      .leftJoin(user, eq(user.id, userDbAllotments.userId))
      .leftJoin(teams, eq(teams.id, userDbAllotments.teamId))
      .where(eq(userDbAllotments.dbId, id))
      .orderBy(userDbAllotments.createdAt),
  ])

  const userTeamIds = (
    await db
      .select({ id: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, session.user.id))
  ).map((r) => r.id)

  let sharedViaTeams: { id: string; name: string }[] = []
  if (userTeamIds.length > 0) {
    const teamAllots = await db
      .select({ teamId: teams.id, teamName: teams.name })
      .from(userDbAllotments)
      .innerJoin(teams, eq(teams.id, userDbAllotments.teamId))
      .where(
        and(
          eq(userDbAllotments.dbId, id),
          sql`${userDbAllotments.teamId} IN (${sql.join(userTeamIds, sql`, `)})`
        )
      )
    sharedViaTeams = teamAllots.map((a) => ({ id: a.teamId, name: a.teamName }))
  }

  const [directAllot] = await db
    .select({ id: userDbAllotments.id })
    .from(userDbAllotments)
    .where(and(eq(userDbAllotments.dbId, id), eq(userDbAllotments.userId, session.user.id)))
    .limit(1)

  return {
    ...db_,
    columns: cols,
    allotments: allots,
    isOwner,
    userPermission: await getUserEffectivePermission(id, session.user.id),
    sharedViaTeams,
    hasDirectAllotment: !!directAllot,
  }
}

export async function updateDatabase(id: string, formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const name = formData.get("name") as string
  const description = formData.get("description") as string | null
  const icon = formData.get("icon") as string | null
  const image = formData.get("image") as string | null
  if (!name?.trim()) throw new Error("Name is required")

  const [db_] = await db
    .select({ createdBy: databases.createdBy })
    .from(databases)
    .where(eq(databases.id, id))
  if (!db_ || db_.createdBy !== session.user.id) throw new Error("Forbidden")

  await db
    .update(databases)
    .set({ name: name.trim(), description: description?.trim() || null, icon: icon?.trim() || null, image: image?.trim() || null })
    .where(eq(databases.id, id))

  await logActivity("database", id, "updated", session.user.id)
  revalidatePath(`/dashboard/databases/${id}`)
  revalidatePath("/dashboard/databases")
  return { success: true }
}

// ─── Columns ──────────────────────────────────────────────────────

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "field"
}

async function requireWritePermission(dbId: string, sessionUserId: string): Promise<boolean> {
  const [db_] = await db.select({ createdBy: databases.createdBy }).from(databases).where(eq(databases.id, dbId))
  if (!db_) throw new Error("Database not found")
  if (db_.createdBy === sessionUserId) return true

  const perm = await getUserEffectivePermission(dbId, sessionUserId)
  if (!perm || perm === "r") throw new Error("Forbidden: read-only")
  return true
}

export async function addColumn(dbId: string, name: string, type = "string") {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  await requireWritePermission(dbId, session.user.id)

  const slug = slugify(name)
  const [max] = await db
    .select({ mx: sql<string>`MAX("order")` })
    .from(dbCols)
    .where(eq(dbCols.dbId, dbId))

  const [col] = await db
    .insert(dbCols)
    .values({ dbId, name: name.trim(), slug, type, order: (Number(max?.mx ?? 0) + 1) })
    .returning()

  await logActivity("db_col", col.id, "created", session.user.id)
  revalidatePath(`/dashboard/databases/${dbId}`)
  return { success: true, column: col }
}

export async function updateColumn(colId: string, data: { name?: string; slug?: string; type?: string; bgColor?: string; icon?: string; order?: number }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const [col] = await db.select({ dbId: dbCols.dbId }).from(dbCols).where(eq(dbCols.id, colId))
  if (!col) throw new Error("Column not found")
  await requireWritePermission(col.dbId, session.user.id)

  await db.update(dbCols).set(data).where(eq(dbCols.id, colId))
  await logActivity("db_col", colId, "updated", session.user.id)
  revalidatePath(`/dashboard/databases/${col.dbId}`)
  return { success: true }
}

export async function deleteColumn(colId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const [col] = await db.select({ dbId: dbCols.dbId }).from(dbCols).where(eq(dbCols.id, colId))
  if (!col) throw new Error("Column not found")
  await requireWritePermission(col.dbId, session.user.id)

  await db.delete(dbCols).where(eq(dbCols.id, colId))
  await logActivity("db_col", colId, "deleted", session.user.id)
  revalidatePath(`/dashboard/databases/${col.dbId}`)
  return { success: true }
}

// ─── Records ──────────────────────────────────────────────────────

export async function getRecords(dbId: string): Promise<RecordRow[]> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const rows = await db
    .select()
    .from(dbValues)
    .where(eq(dbValues.dbId, dbId))
    .orderBy(desc(dbValues.createdAt))

  return rows.map((r) => ({ ...r, values: r.values as Record<string, unknown> }))
}



export async function deleteRecord(recordId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const [record] = await db.select({ dbId: dbValues.dbId }).from(dbValues).where(eq(dbValues.id, recordId))
  if (!record) throw new Error("Record not found")
  await requireWritePermission(record.dbId, session.user.id)

  await db.delete(dbValues).where(eq(dbValues.id, recordId))
  await logActivity("db_value", recordId, "deleted", session.user.id)
  revalidatePath(`/dashboard/databases/${record.dbId}`)
  return { success: true }
}

export async function updateRecordStar(recordId: string, starred: boolean) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  await db.update(dbValues).set({ starred }).where(eq(dbValues.id, recordId))
  await logActivity("db_value", recordId, starred ? "starred" : "unstarred", session.user.id)
  return { success: true }
}

export async function importCsv(dbId: string, columns: { name: string; slug: string }[], rows: Record<string, unknown>[]) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  await requireWritePermission(dbId, session.user.id)

  const existingCols = await db.select({ slug: dbCols.slug }).from(dbCols).where(eq(dbCols.dbId, dbId))
  const existingSlugs = new Set(existingCols.map((c) => c.slug))

  const [max] = await db
    .select({ mx: sql<string>`MAX("order")` })
    .from(dbCols)
    .where(eq(dbCols.dbId, dbId))

  let nextOrder = Number(max?.mx ?? 0) + 1

  for (const col of columns) {
    if (!existingSlugs.has(col.slug)) {
      await db.insert(dbCols).values({ dbId, name: col.name, slug: col.slug, order: nextOrder })
      nextOrder++
    }
  }

  if (rows.length > 0) {
    await db.insert(dbValues).values(
      rows.map((r) => ({ dbId, values: r, submittedBy: session.user.id }))
    )
  }

  await logActivity("database", dbId, "updated", session.user.id)
  revalidatePath(`/dashboard/databases/${dbId}`)
  return { success: true, importedRows: rows.length }
}

// ─── Allotments ───────────────────────────────────────────────────

export async function getUserTeamsSimple(): Promise<SimpleTeam[]> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  return await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .innerJoin(teamMembers, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, session.user.id))
}

export async function addAllotment(
  dbId: string,
  target: { type: "user" | "team"; email?: string; teamId?: string },
  permission: "f" | "rw" | "r"
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const [db_] = await db.select({ name: databases.name, createdBy: databases.createdBy }).from(databases).where(eq(databases.id, dbId))
  if (!db_ || db_.createdBy !== session.user.id) throw new Error("Forbidden")

  if (target.type === "user") {
    if (!target.email) throw new Error("Email required")
    const [u] = await db.select().from(user).where(eq(user.email, target.email))
    if (!u) throw new Error("User not found")

    const [existing] = await db
      .select()
      .from(userDbAllotments)
      .where(and(eq(userDbAllotments.dbId, dbId), eq(userDbAllotments.userId, u.id)))
    if (existing) throw new Error("User already has access")

    await db.insert(userDbAllotments).values({ dbId, userId: u.id, permission })

    await pushNotification({
      userId: u.id,
      title: `Access to database "${db_?.name || "Database"}"`,
      description: `You were given ${permission === "f" ? "full" : permission === "rw" ? "read-write" : "read"} access`,
      icon: "Database",
      url: `/dashboard/databases/${dbId}`,
    })
  } else {
    if (!target.teamId) throw new Error("Team required")
    await db.insert(userDbAllotments).values({ dbId, teamId: target.teamId, permission })
  }

  await logActivity("allotment", dbId, "shared", session.user.id)
  revalidatePath(`/dashboard/databases/${dbId}`)
  return { success: true }
}

export async function updateAllotmentPermission(allotmentId: string, permission: "f" | "rw" | "r") {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const [a] = await db
    .select({ dbId: userDbAllotments.dbId, userId: userDbAllotments.userId })
    .from(userDbAllotments)
    .where(eq(userDbAllotments.id, allotmentId))
  if (!a) throw new Error("Allotment not found")

  const [db_] = await db.select({ name: databases.name, createdBy: databases.createdBy }).from(databases).where(eq(databases.id, a.dbId))
  if (!db_ || db_.createdBy !== session.user.id) throw new Error("Forbidden")

  await db.update(userDbAllotments).set({ permission }).where(eq(userDbAllotments.id, allotmentId))

  await logActivity("allotment", allotmentId, "permission_changed", session.user.id)

  if (a.userId) {
    await pushNotification({
      userId: a.userId,
      title: `Access updated for "${db_.name}"`,
      description: `Your permission was changed to ${permission === "f" ? "full" : permission === "rw" ? "read-write" : "read"}`,
      icon: "Database",
      url: `/dashboard/databases/${a.dbId}`,
    })
  }

  revalidatePath(`/dashboard/databases/${a.dbId}`)
  return { success: true }
}

export async function removeAllotment(allotmentId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const [a] = await db
    .select({ dbId: userDbAllotments.dbId, userId: userDbAllotments.userId })
    .from(userDbAllotments)
    .where(eq(userDbAllotments.id, allotmentId))
  if (!a) throw new Error("Allotment not found")

  const [db_] = await db.select({ name: databases.name, createdBy: databases.createdBy }).from(databases).where(eq(databases.id, a.dbId))
  if (!db_ || db_.createdBy !== session.user.id) throw new Error("Forbidden")

  await db.delete(userDbAllotments).where(eq(userDbAllotments.id, allotmentId))

  await logActivity("allotment", allotmentId, "deleted", session.user.id)

  if (a.userId) {
    await pushNotification({
      userId: a.userId,
      title: `Access removed for "${db_.name}"`,
      description: `Your access was removed`,
      icon: "Database",
    })
  }

  revalidatePath(`/dashboard/databases/${a.dbId}`)
  return { success: true }
}



// Add this to your existing databases.ts file

// Helper to check if a column is a trigger column
export async function isTriggerColumn(colId: string): Promise<boolean> {
  const [col] = await db.select({ type: dbCols.type }).from(dbCols).where(eq(dbCols.id, colId))
  return col?.type === "trigger"
}

// Get columns by type
export async function getColumnsByType(dbId: string, type: string): Promise<ColumnDef[]> {
  return await db.select().from(dbCols).where(and(eq(dbCols.dbId, dbId), eq(dbCols.type, type)))
}


// Add this function to create a trigger column
export async function addTriggerColumn(
  dbId: string, 
  name: string, 
  dateColumnId: string, 
  messageColumnId?: string, 
  staticMessage?: string
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const slug = slugify(name)
  const [max] = await db
    .select({ mx: sql<string>`MAX("order")` })
    .from(dbCols)
    .where(eq(dbCols.dbId, dbId))

  const [col] = await db
    .insert(dbCols)
    .values({
      dbId,
      name: name.trim(),
      slug,
      type: "trigger",
      triggerDateColumnId: dateColumnId,
      triggerMessageColumnId: messageColumnId || null,
      triggerStaticMessage: staticMessage || null,
      order: (Number(max?.mx ?? 0) + 1)
    })
    .returning()

  revalidatePath(`/dashboard/databases/${dbId}`)
  return { success: true, column: col }
}

// Update addRecord to check triggers
export async function addRecord(dbId: string, values: Record<string, unknown>) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  await requireWritePermission(dbId, session.user.id)

  const [record] = await db
    .insert(dbValues)
    .values({ dbId, values, submittedBy: session.user.id })
    .returning()

  // Check triggers
  await checkAndExecuteTrigger(dbId, record.id, values)

  await logActivity("db_value", record.id, "created", session.user.id)
  revalidatePath(`/dashboard/databases/${dbId}`)
  return { success: true, record }
}

// Update updateRecord to check triggers
export async function updateRecord(recordId: string, values: Record<string, unknown>) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const [record] = await db.select({ dbId: dbValues.dbId, values: dbValues.values }).from(dbValues).where(eq(dbValues.id, recordId))
  if (!record) throw new Error("Record not found")
  await requireWritePermission(record.dbId, session.user.id)

  const newValues = { ...(record.values as Record<string, unknown>), ...values }
  await db.update(dbValues).set({ values: newValues }).where(eq(dbValues.id, recordId))
  
  // Check triggers on update
  await checkAndExecuteTrigger(record.dbId, recordId, newValues)

  await logActivity("db_value", recordId, "updated", session.user.id)
  revalidatePath(`/dashboard/databases/${record.dbId}`)
  return { success: true }
}

// Import the trigger function
import { checkAndExecuteTrigger } from "./triggers2" 