import { NextRequest, NextResponse } from "next/server"
import { getSession, errorResponse } from "@/lib/api-utils"
import { db } from "@/db"
import { formSubmissions } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; subId: string }> }) {
  try {
    await getSession()
    const { subId } = await params
    const body = await req.json()
    const { starred } = body
    await db.update(formSubmissions).set({ starred }).where(eq(formSubmissions.id, subId))
    return NextResponse.json({ success: true })
  } catch (e) {
    return errorResponse(e, 401)
  }
}
