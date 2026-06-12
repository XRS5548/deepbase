import { NextRequest, NextResponse } from "next/server"
import { getSession, errorResponse } from "@/lib/api-utils"
import { db } from "@/db"
import { waAccounts } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getSession()
    const accounts = await db
      .select()
      .from(waAccounts)
      .where(eq(waAccounts.userId, session.user.id))
      .orderBy(desc(waAccounts.createdAt))
    return NextResponse.json(accounts)
  } catch (e) {
    return errorResponse(e, 401)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    const { name } = await req.json()
    if (!name?.trim()) return errorResponse("Name is required")

    const [account] = await db
      .insert(waAccounts)
      .values({ userId: session.user.id, name: name.trim() })
      .returning()

    return NextResponse.json({ success: true, account })
  } catch (e) {
    return errorResponse(e)
  }
}
