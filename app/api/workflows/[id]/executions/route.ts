import { NextRequest, NextResponse } from "next/server";
import { getSession, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { workflowExecutions, workflows } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    const { id } = await params;

    // Verify ownership
    const [workflow] = await db
      .select({ createdBy: workflows.createdBy })
      .from(workflows)
      .where(eq(workflows.id, id));

    if (!workflow) return errorResponse("Workflow not found", 404);
    if (workflow.createdBy !== session.user.id) return errorResponse("Forbidden", 403);

    const executions = await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.workflowId, id))
      .orderBy(desc(workflowExecutions.startedAt))
      .limit(50);

    return NextResponse.json({ executions });
  } catch (e) {
    return errorResponse(e, 401);
  }
}
