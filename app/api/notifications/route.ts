import { NextResponse } from "next/server";
import { getSession, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();

    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.user.id))
      .orderBy(desc(notifications.createdAt));

    return NextResponse.json(rows);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST() {
  try {
    const session = await getSession();

    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, session.user.id));

    return NextResponse.json({ success: true });
  } catch (e) {
    return errorResponse(e);
  }
}
