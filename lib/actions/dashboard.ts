"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/db"
import * as s from "@/db/schema"
import { eq, desc, and, gte, sql } from "drizzle-orm"

export type DashboardData = {
  stats: {
    databases: number
    forms: number
    teams: number
    triggers: number
  }
  notifications: Array<{
    id: string
    title: string
    description: string | null
    read: boolean
    createdAt: Date
  }>
  activity: Array<{
    id: string
    entity: string
    action: string
    createdAt: Date
  }>
  weeklyActivity: Array<{ day: string; count: number }>
}

export async function getDashboardData(): Promise<DashboardData> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const userId = session.user.id
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [stats, notifs, logs, weekLogs] = await Promise.all([
    (async () => {
      const [d, f, t, tm] = await Promise.all([
        db.select({ v: sql<string>`count(*)` }).from(s.databases).where(eq(s.databases.createdBy, userId)),
        db.select({ v: sql<string>`count(*)` }).from(s.forms).where(eq(s.forms.createdBy, userId)),
        db.select({ v: sql<string>`count(*)` }).from(s.dateTriggers).where(eq(s.dateTriggers.createdBy, userId)),
        db.select({ v: sql<string>`count(*)` }).from(s.teamMembers).where(eq(s.teamMembers.userId, userId)),
      ])
      return {
        databases: Number(d[0]?.v ?? 0),
        forms: Number(f[0]?.v ?? 0),
        triggers: Number(t[0]?.v ?? 0),
        teams: Number(tm[0]?.v ?? 0),
      }
    })(),
    db.select({
      id: s.notifications.id,
      title: s.notifications.title,
      description: s.notifications.description,
      read: s.notifications.read,
      createdAt: s.notifications.createdAt,
    })
      .from(s.notifications)
      .where(eq(s.notifications.userId, userId))
      .orderBy(desc(s.notifications.createdAt))
      .limit(5),
    db.select({
      id: s.updateLogs.id,
      entity: s.updateLogs.entity,
      action: s.updateLogs.action,
      createdAt: s.updateLogs.createdAt,
    })
      .from(s.updateLogs)
      .where(eq(s.updateLogs.performedBy, userId))
      .orderBy(desc(s.updateLogs.createdAt))
      .limit(10),
    db.select({ createdAt: s.updateLogs.createdAt })
      .from(s.updateLogs)
      .where(and(eq(s.updateLogs.performedBy, userId), gte(s.updateLogs.createdAt, sevenDaysAgo))),
  ])

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const dayCounts: Record<string, number> = Object.fromEntries(days.map(d => [d, 0]))
  weekLogs.forEach(log => {
    const day = days[log.createdAt.getDay()]
    dayCounts[day]++
  })

  return {
    stats,
    notifications: notifs,
    activity: logs,
    weeklyActivity: days.map(day => ({ day, count: dayCounts[day] })),
  }
}
