import { NextResponse } from "next/server";
import { getSession, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { databases, dbCols, userDbAllotments, teamMembers } from "@/db/schema";
import { eq, desc, or, sql } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();

    const userTeamIds = (
      await db
        .select({ id: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.userId, session.user.id))
    ).map((r) => r.id);

    const rows = await db
      .select({
        id: databases.id,
        name: databases.name,
        description: databases.description,
      })
      .from(databases)
      .where(
        or(
          eq(databases.createdBy, session.user.id),
          sql`${databases.id} IN (SELECT ${userDbAllotments.dbId} FROM ${userDbAllotments} WHERE ${userDbAllotments.userId} = ${session.user.id})`,
          userTeamIds.length > 0
            ? sql`${databases.id} IN (SELECT ${userDbAllotments.dbId} FROM ${userDbAllotments} WHERE ${userDbAllotments.teamId} IN (${sql.join(userTeamIds, sql`, `)}))`
            : sql`1=0`,
        ),
      )
      .orderBy(desc(databases.createdAt));

    // Fetch columns for each database
    const result = [];
    for (const dbInst of rows) {
      const columns = await db
        .select({
          name: dbCols.name,
          slug: dbCols.slug,
          type: dbCols.type,
        })
        .from(dbCols)
        .where(eq(dbCols.dbId, dbInst.id))
        .orderBy(dbCols.order);

      result.push({
        id: dbInst.id,
        name: dbInst.name,
        description: dbInst.description,
        columns: columns.map((c) => ({
          name: c.name,
          slug: c.slug,
          type: c.type,
        })),
      });
    }

    return NextResponse.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
