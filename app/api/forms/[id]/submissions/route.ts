import { NextRequest, NextResponse } from "next/server"
import { getSession, errorResponse } from "@/lib/api-utils"
import { db } from "@/db"
import { formSubmissions } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await getSession()
    const { id } = await params

    const rows = await db
      .select()
      .from(formSubmissions)
      .where(eq(formSubmissions.formId, id))
      .orderBy(desc(formSubmissions.submittedAt))

    return NextResponse.json(rows.map((r) => ({ ...r, values: r.values as Record<string, unknown> })))
  } catch (e) {
    return errorResponse(e, 401)
  }
}
