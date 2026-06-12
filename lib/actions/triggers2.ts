"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/db"
import { dbCols, dbValues, triggerExecutions, userDbAllotments, teams, teamMembers, databases } from "@/db/schema"
import { pushNotification, pushNotificationToUsers } from "@/lib/notification-utils"
import { eq, and, sql, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"

// Check and execute trigger for a record
export async function checkAndExecuteTrigger(dbId: string, recordId: string, recordValues: Record<string, any>) {
  try {
    // Find all trigger columns in this database
    const triggerColumns = await db
      .select()
      .from(dbCols)
      .where(and(eq(dbCols.dbId, dbId), eq(dbCols.type, "trigger")))

    for (const triggerCol of triggerColumns) {
      // Check if this trigger has already been executed for this record
      const existingExecution = await db
        .select()
        .from(triggerExecutions)
        .where(
          and(
            eq(triggerExecutions.triggerColumnId, triggerCol.id),
            eq(triggerExecutions.recordId, recordId)
          )
        )
        .limit(1)

      if (existingExecution.length > 0) {
        continue // Already executed
      }

      // Get the date column value
      let dateValue = null
      let shouldTrigger = false

      if (triggerCol.triggerDateColumnId) {
        const dateColumn = await db
          .select()
          .from(dbCols)
          .where(eq(dbCols.id, triggerCol.triggerDateColumnId))
          .limit(1)

        if (dateColumn.length > 0) {
          dateValue = recordValues[dateColumn[0].slug]
          if (dateValue) {
            const triggerDate = new Date(dateValue)
            const now = new Date()
            
            // Trigger if date is today or in the past
            if (triggerDate <= now) {
              shouldTrigger = true
            } else {
              // Schedule for future - store as pending
              await db.insert(triggerExecutions).values({
                dbId,
                triggerColumnId: triggerCol.id,
                recordId,
                status: "pending",
              })
            }
          }
        }
      }

      if (shouldTrigger) {
        await executeTrigger(triggerCol, recordId, recordValues)
      }
    }
  } catch (error) {
    console.error("Error checking trigger:", error)
  }
}

// Execute a single trigger
async function executeTrigger(triggerCol: any, recordId: string, recordValues: Record<string, any>) {
  // Get message
  let message = triggerCol.triggerStaticMessage || ""

  if (triggerCol.triggerMessageColumnId && !message) {
    const messageColumn = await db
      .select()
      .from(dbCols)
      .where(eq(dbCols.id, triggerCol.triggerMessageColumnId))
      .limit(1)

    if (messageColumn.length > 0) {
      message = recordValues[messageColumn[0].slug] || ""
    }
  }

  if (!message) {
    message = "Your trigger has been activated!"
  }

  // Get all users with access to this database
  const users = await getDatabaseUsers(triggerCol.dbId)

  // Send notifications
  await pushNotificationToUsers(
    users.map(userId => ({
      userId,
      title: `🔔 Trigger: ${triggerCol.name}`,
      description: message,
      icon: "Bell",
      url: `/dashboard/databases/${triggerCol.dbId}`,
    }))
  )

  // Log execution
  await db.insert(triggerExecutions).values({
    dbId: triggerCol.dbId,
    triggerColumnId: triggerCol.id,
    recordId,
    status: "executed",
    message,
    executedAt: new Date(),
  })
}

// Check pending triggers (call this on page load and periodically)
export async function checkPendingTriggers(dbId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return

  // Get all pending executions
  const pendingExecutions = await db
    .select()
    .from(triggerExecutions)
    .where(and(eq(triggerExecutions.dbId, dbId), eq(triggerExecutions.status, "pending")))

  for (const execution of pendingExecutions) {
    // Get trigger column
    const triggerCol = await db
      .select()
      .from(dbCols)
      .where(eq(dbCols.id, execution.triggerColumnId))
      .limit(1)

    if (triggerCol.length === 0) continue

    // Get record
    const record = await db
      .select()
      .from(dbValues)
      .where(eq(dbValues.id, execution.recordId))
      .limit(1)

    if (record.length === 0) continue

    // Get date column value
    if (triggerCol[0].triggerDateColumnId) {
      const dateColumn = await db
        .select()
        .from(dbCols)
        .where(eq(dbCols.id, triggerCol[0].triggerDateColumnId))
        .limit(1)

      if (dateColumn.length > 0) {
        const values = record[0].values as Record<string, unknown>
        const dateValue = values[dateColumn[0].slug] as string | undefined
        if (dateValue) {
          const triggerDate = new Date(dateValue)
          const now = new Date()
          
          if (triggerDate <= now) {
            await executeTrigger(triggerCol[0], execution.recordId, record[0].values as Record<string, any>)
          }
        }
      }
    }
  }
}

// Helper: Get all users with access to a database
async function getDatabaseUsers(dbId: string): Promise<string[]> {
  const [db_] = await db.select({ createdBy: databases.createdBy }).from(databases).where(eq(databases.id, dbId))
  if (!db_) return []

  const users = new Set<string>()
  users.add(db_.createdBy)

  // Get direct allotments
  const directAllots = await db
    .select({ userId: userDbAllotments.userId })
    .from(userDbAllotments)
    .where(and(eq(userDbAllotments.dbId, dbId), sql`${userDbAllotments.userId} IS NOT NULL`))
  
  for (const allot of directAllots) {
    if (allot.userId) users.add(allot.userId)
  }

  // Get team members
  const teamAllots = await db
    .select({ teamId: userDbAllotments.teamId })
    .from(userDbAllotments)
    .where(and(eq(userDbAllotments.dbId, dbId), sql`${userDbAllotments.teamId} IS NOT NULL`))

  for (const teamAllot of teamAllots) {
    const members = await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamAllot.teamId!))
    
    for (const member of members) {
      users.add(member.userId)
    }
  }

  return Array.from(users)
}

// Get trigger logs for a database
export async function getTriggerLogs(dbId: string) {
  const logs = await db
    .select({
      id: triggerExecutions.id,
      triggerColumnId: triggerExecutions.triggerColumnId,
      recordId: triggerExecutions.recordId,
      executedAt: triggerExecutions.executedAt,
      status: triggerExecutions.status,
      message: triggerExecutions.message,
      columnName: dbCols.name,
    })
    .from(triggerExecutions)
    .leftJoin(dbCols, eq(dbCols.id, triggerExecutions.triggerColumnId))
    .where(eq(triggerExecutions.dbId, dbId))
    .orderBy(sql`${triggerExecutions.executedAt} DESC`)

  return logs
}