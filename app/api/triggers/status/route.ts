import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/db"
import { dbTriggers, triggerExecutions } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dbId = searchParams.get("dbId")

    if (!dbId) {
      return NextResponse.json({ error: "Missing dbId" }, { status: 400 })
    }

    // Get all triggers for this database
    const triggers = await db
      .select()
      .from(dbTriggers)
      .where(eq(dbTriggers.dbId, dbId))
      .orderBy(desc(dbTriggers.createdAt))

    // Get recent executions
    const executions = await db
      .select()
      .from(triggerExecutions)
      .where(eq(triggerExecutions.dbId, dbId))
      .orderBy(desc(triggerExecutions.executedAt))
      .limit(50)

    const stats = {
      totalTriggers: triggers.length,
      activeTriggers: triggers.filter(t => t.isActive).length,
      totalExecutions: executions.length,
      successCount: executions.filter(e => e.status === "executed").length,
      failedCount: executions.filter(e => e.status === "failed").length,
      pendingCount: executions.filter(e => e.status === "pending").length,
      lastExecution: executions[0]?.executedAt || null,
    }

    return NextResponse.json({
      success: true,
      triggers,
      executions,
      stats,
    })
  } catch (error) {
    console.error("Status API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}