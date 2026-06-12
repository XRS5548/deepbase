import { NextRequest, NextResponse } from "next/server"
import { getSession, errorResponse } from "@/lib/api-utils"
import { db } from "@/db"
import { emailAccounts } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getSession()
    const accounts = await db
      .select()
      .from(emailAccounts)
      .where(eq(emailAccounts.userId, session.user.id))
      .orderBy(desc(emailAccounts.createdAt))
    return NextResponse.json(accounts)
  } catch (e) {
    return errorResponse(e, 401)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    const body = await req.json()
    const { name, email, smtpHost, smtpPort, smtpUser, smtpPass, useSSL } = body

    if (!name?.trim() || !email?.trim() || !smtpHost?.trim() || !smtpUser?.trim() || !smtpPass?.trim()) {
      return errorResponse("All fields are required")
    }

    const [account] = await db
      .insert(emailAccounts)
      .values({
        userId: session.user.id,
        name: name.trim(),
        email: email.trim(),
        smtpHost: smtpHost.trim(),
        smtpPort: smtpPort || 587,
        smtpUser: smtpUser.trim(),
        smtpPass: smtpPass,
        useSSL: useSSL || false,
      })
      .returning()

    return NextResponse.json({ success: true, account })
  } catch (e) {
    return errorResponse(e)
  }
}
