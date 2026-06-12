import { NextRequest, NextResponse } from "next/server"
import { getSession, errorResponse } from "@/lib/api-utils"
import { db } from "@/db"
import { emailAccounts, emailLogs } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { sendEmail } from "@/lib/email-utils"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const { id } = await params

    const [account] = await db
      .select()
      .from(emailAccounts)
      .where(and(eq(emailAccounts.id, id), eq(emailAccounts.userId, session.user.id)))

    if (!account) return errorResponse("Account not found", 404)

    const logs = await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.accountId, id))
      .orderBy(desc(emailLogs.sentAt))
      .limit(50)

    return NextResponse.json({ account, logs })
  } catch (e) {
    return errorResponse(e, 401)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const { id } = await params
    const body = await req.json()
    const { name, email, smtpHost, smtpPort, smtpUser, smtpPass, useSSL } = body

    const [existing] = await db
      .select()
      .from(emailAccounts)
      .where(and(eq(emailAccounts.id, id), eq(emailAccounts.userId, session.user.id)))
    if (!existing) return errorResponse("Account not found", 404)

    const [updated] = await db
      .update(emailAccounts)
      .set({
        name: name?.trim() ?? existing.name,
        email: email?.trim() ?? existing.email,
        smtpHost: smtpHost?.trim() ?? existing.smtpHost,
        smtpPort: smtpPort ?? existing.smtpPort,
        smtpUser: smtpUser?.trim() ?? existing.smtpUser,
        smtpPass: smtpPass ?? existing.smtpPass,
        useSSL: useSSL ?? existing.useSSL,
        updatedAt: new Date(),
      })
      .where(eq(emailAccounts.id, id))
      .returning()

    return NextResponse.json({ success: true, account: updated })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const { id } = await params

    const [existing] = await db
      .select()
      .from(emailAccounts)
      .where(and(eq(emailAccounts.id, id), eq(emailAccounts.userId, session.user.id)))
    if (!existing) return errorResponse("Account not found", 404)

    await db.delete(emailAccounts).where(eq(emailAccounts.id, id))
    return NextResponse.json({ success: true })
  } catch (e) {
    return errorResponse(e, 401)
  }
}
