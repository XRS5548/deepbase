import { db } from "@/db"
import { forms, userFormAllotments, teamMembers } from "@/db/schema"
import { eq, and, or, sql } from "drizzle-orm"

export async function getUserEffectivePermission(formId: string, sessionUserId: string): Promise<"f" | "rw" | "r" | null> {
  const userTeamIds = (
    await db
      .select({ id: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, sessionUserId))
  ).map((r) => r.id)

  const allots = await db
    .select({ permission: userFormAllotments.permission })
    .from(userFormAllotments)
    .where(
      and(
        eq(userFormAllotments.formId, formId),
        or(
          eq(userFormAllotments.userId, sessionUserId),
          userTeamIds.length > 0
            ? sql`${userFormAllotments.teamId} IN (${sql.join(userTeamIds, sql`, `)})`
            : sql`1=0`
        )
      )
    )

  const rank: Record<string, number> = { f: 3, rw: 2, r: 1 }
  let best: "f" | "rw" | "r" | null = null
  for (const a of allots) {
    if (!best || rank[a.permission] > rank[best]) best = a.permission
  }
  return best
}

export async function requireWritePermission(formId: string, sessionUserId: string): Promise<void> {
  const [f] = await db.select({ createdBy: forms.createdBy }).from(forms).where(eq(forms.id, formId))
  if (!f) throw new Error("Form not found")
  if (f.createdBy === sessionUserId) return

  const perm = await getUserEffectivePermission(formId, sessionUserId)
  if (!perm || perm === "r") throw new Error("Forbidden: read-only")
}
