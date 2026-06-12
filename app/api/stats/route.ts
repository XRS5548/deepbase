import { NextResponse } from "next/server"
import { getSession, errorResponse } from "@/lib/api-utils"
import { db } from "@/db"
import { databases, forms, dateTriggers, teamMembers } from "@/db/schema"
import { eq, sql } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getSession()
    const userId = session.user.id

    const [d, f, t, tm] = await Promise.all([
      db.select({ v: sql<string>`count(*)` }).from(databases).where(eq(databases.createdBy, userId)),
      db.select({ v: sql<string>`count(*)` }).from(forms).where(eq(forms.createdBy, userId)),
      db.select({ v: sql<string>`count(*)` }).from(dateTriggers).where(eq(dateTriggers.createdBy, userId)),
      db.select({ v: sql<string>`count(*)` }).from(teamMembers).where(eq(teamMembers.userId, userId)),
    ])

    return NextResponse.json({
      databases: Number(d[0]?.v ?? 0),
      forms: Number(f[0]?.v ?? 0),
      triggers: Number(t[0]?.v ?? 0),
      teams: Number(tm[0]?.v ?? 0),
    })
  } catch (e) {
    return errorResponse(e)
  }
}
