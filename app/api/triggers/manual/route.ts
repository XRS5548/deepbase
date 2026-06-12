import { NextResponse } from "next/server"
import { db } from "@/db"
import { dbTriggers, dbCols, dbValues, triggerExecutions, databases, userDbAllotments, teams, teamMembers, notifications } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function POST(request: Request) {
  try {
    const { triggerId, recordId, secret } = await request.json()
    
    const CRON_SECRET = process.env.CRON_SECRET || "your-super-secret-cron-key-change-this"
    
    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!triggerId || !recordId) {
      return NextResponse.json({ error: "Missing triggerId or recordId" }, { status: 400 })
    }

    // Get trigger details
    const triggers = await db
      .select()
      .from(dbTriggers)
      .where(eq(dbTriggers.id, triggerId))
      .limit(1)

    if (!triggers.length) {
      return NextResponse.json({ error: "Trigger not found" }, { status: 404 })
    }

    const trigger = triggers[0]

    // Get record details
    const records = await db
      .select()
      .from(dbValues)
      .where(eq(dbValues.id, recordId))
      .limit(1)

    if (!records.length) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    const record = records[0]

    // Get message column if exists
    let message = trigger.message || ""
    
    if (trigger.messageColumnId) {
      const msgCol = await db
        .select()
        .from(dbCols)
        .where(eq(dbCols.id, trigger.messageColumnId))
        .limit(1)
      
      const recValues = record.values as Record<string, unknown>
      if (msgCol.length && record.values && recValues[msgCol[0].slug]) {
        const val = recValues[msgCol[0].slug]
        message = typeof val === 'string' ? val : String(val)
      }
    }

    if (!message) {
      message = `Manual trigger "${trigger.name}" has been activated!`
    }

    // Get all users who have access
    const users = await getDatabaseUsers(trigger.dbId)

    // Send notifications
    for (const userId of users) {
      await db.insert(notifications).values({
        userId: userId,
        title: `🔔 ${trigger.name} (Manual)`,
        description: message,
        icon: "Bell",
        url: `/dashboard/databases/${trigger.dbId}`,
        read: false,
        createdAt: new Date(),
      })
    }

    // Log execution
    await db.insert(triggerExecutions).values({
      dbId: trigger.dbId,
      triggerColumnId: trigger.id,
      recordId: record.id,
      status: "executed",
      message: message,
      executedAt: new Date(),
    })

    return NextResponse.json({ 
      success: true, 
      message: "Trigger executed manually",
      usersNotified: users.length 
    })
  } catch (error) {
    console.error("Manual trigger error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function getDatabaseUsers(dbId: string): Promise<string[]> {
  const dbResult = await db
    .select({ createdBy: databases.createdBy })
    .from(databases)
    .where(eq(databases.id, dbId))
    .limit(1)
  
  if (!dbResult.length) return []

  const users = new Set<string>()
  users.add(dbResult[0].createdBy)

  const directAllots = await db
    .select({ userId: userDbAllotments.userId })
    .from(userDbAllotments)
    .where(and(eq(userDbAllotments.dbId, dbId)))
  
  for (const allot of directAllots) {
    if (allot.userId) users.add(allot.userId)
  }

  const teamAllots = await db
    .select({ teamId: userDbAllotments.teamId })
    .from(userDbAllotments)
    .where(eq(userDbAllotments.dbId, dbId))

  for (const teamAllot of teamAllots) {
    if (teamAllot.teamId) {
      const members = await db
        .select({ userId: teamMembers.userId })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, teamAllot.teamId))
      
      for (const member of members) {
        users.add(member.userId)
      }
    }
  }

  return Array.from(users)
}