import { NextRequest, NextResponse } from "next/server";
import { getSession, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const { id } = await params;
    const body = await req.json();

    await db
      .update(notifications)
      .set({ read: body.read })
      .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const { id } = await params;

    await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (e) {
    return errorResponse(e);
  }
}
