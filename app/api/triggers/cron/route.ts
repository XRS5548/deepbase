import { NextResponse } from "next/server"
import { db } from "@/db"
import { dbTriggers, dbCols, dbValues, triggerExecutions, databases, userDbAllotments, teams, teamMembers, notifications } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"

const CRON_SECRET = process.env.CRON_SECRET || "your-super-secret-cron-key-change-this"

export async function GET(request: Request) {
  return handleCron(request)
}

export async function POST(request: Request) {
  return handleCron(request)
}

async function handleCron(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const url = new URL(request.url)
    const secret = url.searchParams.get("secret") || authHeader?.replace("Bearer ", "")
    
    if (secret !== CRON_SECRET) {
      console.error("Unauthorized cron attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Cron job started at:", new Date().toISOString())
    
    const now = new Date()
    
    // Get all active triggers
    const triggers = await db
      .select()
      .from(dbTriggers)
      .where(eq(dbTriggers.isActive, true))

    let executed = 0
    let failed = 0

    for (const trigger of triggers) {
      try {
        if (!trigger.dateColumnId) continue

        // Get the date column
        const dateColumn = await db
          .select()
          .from(dbCols)
          .where(eq(dbCols.id, trigger.dateColumnId))
          .limit(1)

        if (!dateColumn.length) continue

        // Get message column if exists
        let messageColumn = null
        if (trigger.messageColumnId) {
          const msgCol = await db
            .select()
            .from(dbCols)
            .where(eq(dbCols.id, trigger.messageColumnId))
            .limit(1)
          if (msgCol.length) messageColumn = msgCol[0]
        }

        // Get records that should trigger
        const records = await db
          .select()
          .from(dbValues)
          .where(
            and(
              eq(dbValues.dbId, trigger.dbId),
              sql`(${dbValues.values}->>${dateColumn[0].slug}) IS NOT NULL`,
              sql`CAST(${dbValues.values}->>${dateColumn[0].slug} AS timestamp) <= ${now.toISOString()}`
            )
          )

        for (const record of records) {
          try {
            // Check if already executed
            const existingExecution = await db
              .select()
              .from(triggerExecutions)
              .where(
                and(
                  eq(triggerExecutions.triggerColumnId, trigger.id),
                  eq(triggerExecutions.recordId, record.id)
                )
              )
              .limit(1)

            if (existingExecution.length > 0) continue

            // Get the message
            let message = trigger.message || ""
            
            if (messageColumn && record.values && messageColumn.slug) {
              const values = record.values as Record<string, unknown>
              const val = values[messageColumn.slug]
              if (val) {
                message = typeof val === 'string' ? val : String(val)
              }
            }

            if (!message) {
              message = `Trigger "${trigger.name}" has been activated!`
            }

            // Get all users who have access to this database
            const users = await getDatabaseUsers(trigger.dbId)

            if (users.length > 0) {
              await sendNotifications(users, trigger.name, message, trigger.dbId)
              console.log(`Trigger "${trigger.name}" executed for ${users.length} users`)
            }

            // Log successful execution
            await db.insert(triggerExecutions).values({
              dbId: trigger.dbId,
              triggerColumnId: trigger.id,
              recordId: record.id,
              status: "executed",
              message: message,
              executedAt: new Date(),
            })

            executed++
          } catch (recordError) {
            console.error(`Failed for record ${record.id}:`, recordError)
            
            // Log failed execution
            await db.insert(triggerExecutions).values({
              dbId: trigger.dbId,
              triggerColumnId: trigger.id,
              recordId: record.id,
              status: "failed",
              message: String(recordError),
              executedAt: new Date(),
            })
            failed++
          }
        }
      } catch (err) {
        console.error(`Failed to execute trigger ${trigger.id}:`, err)
        failed++
      }
    }

    console.log(`Cron completed: ${executed} executed, ${failed} failed`)

    return NextResponse.json({
      success: true,
      executed,
      failed,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    )
  }
}

async function sendNotifications(users: string[], triggerName: string, message: string, dbId: string) {
  for (const userId of users) {
    try {
      await db.insert(notifications).values({
        userId: userId,
        title: `🔔 ${triggerName}`,
        description: message,
        icon: "Bell",
        url: `/dashboard/databases/${dbId}`,
        read: false,
        createdAt: new Date(),
      })
    } catch (err) {
      console.error(`Failed to send notification to ${userId}:`, err)
    }
  }
}

async function getDatabaseUsers(dbId: string): Promise<string[]> {
  try {
    const dbResult = await db
      .select({ createdBy: databases.createdBy })
      .from(databases)
      .where(eq(databases.id, dbId))
      .limit(1)
    
    if (!dbResult.length) return []

    const users = new Set<string>()
    users.add(dbResult[0].createdBy)

    // Get direct user allotments
    const directAllots = await db
      .select({ userId: userDbAllotments.userId })
      .from(userDbAllotments)
      .where(
        and(
          eq(userDbAllotments.dbId, dbId),
          sql`${userDbAllotments.userId} IS NOT NULL`
        )
      )
    
    for (const allot of directAllots) {
      if (allot.userId) users.add(allot.userId)
    }

    // Get team members
    const teamAllots = await db
      .select({ teamId: userDbAllotments.teamId })
      .from(userDbAllotments)
      .where(
        and(
          eq(userDbAllotments.dbId, dbId),
          sql`${userDbAllotments.teamId} IS NOT NULL`
        )
      )

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
  } catch (error) {
    console.error("Error getting database users:", error)
    return []
  }
}