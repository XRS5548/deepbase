import { NextResponse } from "next/server";
import { getSession, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { updateLogs } from "@/db/schema";
import { user } from "@/auth-schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();

    const rows = await db
      .select({
        id: updateLogs.id,
        entity: updateLogs.entity,
        entityId: updateLogs.entityId,
        action: updateLogs.action,
        performedBy: updateLogs.performedBy,
        diff: updateLogs.diff,
        meta: updateLogs.meta,
        createdAt: updateLogs.createdAt,
        performerName: user.name,
        performerEmail: user.email,
      })
      .from(updateLogs)
      .leftJoin(user, eq(user.id, updateLogs.performedBy))
      .where(eq(updateLogs.performedBy, session.user.id))
      .orderBy(desc(updateLogs.createdAt));

    return NextResponse.json(rows);
  } catch (e) {
    return errorResponse(e);
  }
}
