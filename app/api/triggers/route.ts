import { NextRequest, NextResponse } from "next/server";
import { getSession, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { dateTriggers, teamMembers } from "@/db/schema";
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

    // Auto mark due triggers as fired
    const allTriggers = await db.select().from(dateTriggers);

    const now = new Date();

    const dueTriggerIds = allTriggers
      .filter((trigger) => {
        const triggerDateTime = new Date(trigger.date);

        if (trigger.time) {
          const [hours, minutes] = trigger.time.split(":").map(Number);

          triggerDateTime.setHours(hours || 0);
          triggerDateTime.setMinutes(minutes || 0);
          triggerDateTime.setSeconds(0);
          triggerDateTime.setMilliseconds(0);
        }

        return triggerDateTime <= now && !trigger.fired;
      })
      .map((trigger) => trigger.id);

    if (dueTriggerIds.length > 0) {
      await db
        .update(dateTriggers)
        .set({ fired: true })
        .where(sql`${dateTriggers.id} IN (${sql.join(dueTriggerIds, sql`, `)})`);
    }

    // Fetch all triggers
    const rows = await db
      .select()
      .from(dateTriggers)
      .where(
        or(
          eq(dateTriggers.userId, session.user.id),
          eq(dateTriggers.createdBy, session.user.id),
          userTeamIds.length > 0
            ? sql`${dateTriggers.teamId} IN (${sql.join(userTeamIds, sql`, `)})`
            : sql`1=0`
        )
      )
      .orderBy(desc(dateTriggers.date));

    return NextResponse.json(rows);
  } catch (e) {
    return errorResponse(e, 401);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json();

    const { date, time, message, icon, bgColor, teamId, dbColId } = body;

    if (!date || !message?.trim()) {
      return errorResponse("Date and message are required");
    }

    const [trigger] = await db
      .insert(dateTriggers)
      .values({
        date: new Date(date),
        time: time || null,
        message: message.trim(),
        icon: icon?.trim() || null,
        bgColor: bgColor || null,
        teamId: teamId || null,
        dbColId: dbColId || null,
        userId: teamId ? null : session.user.id,
        createdBy: session.user.id,
        fired: false,
      })
      .returning();

    return NextResponse.json({
      success: true,
      trigger,
    });
  } catch (e) {
    return errorResponse(e);
  }
}