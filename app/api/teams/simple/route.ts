import { NextResponse } from "next/server"
import { getSession, errorResponse } from "@/lib/api-utils"
import { db } from "@/db"
import { teams, teamMembers } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getSession()
    const result = await db
      .select({ id: teams.id, name: teams.name })
      .from(teams)
      .innerJoin(teamMembers, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, session.user.id))
    return NextResponse.json(result)
  } catch (e) {
    return errorResponse(e, 401)
  }
}
