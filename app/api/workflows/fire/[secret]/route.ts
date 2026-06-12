import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { workflows, workflowExecutions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { executeWorkflow } from "@/lib/workflow-executor";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ secret: string }> },
) {
  try {
    const { secret } = await params;

    if (!secret) {
      return NextResponse.json({ error: "Missing webhook identifier" }, { status: 400 });
    }

    // Look up workflow by webhookSecret (this IS the URL, no query param needed)
    console.error("[fire] looking up secret:", secret.substring(0, 8) + "...");
    const [workflow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.webhookSecret, secret));

    if (!workflow) {
      console.error("[fire] NOT FOUND for secret:", secret.substring(0, 8) + "...");
      // Check if any workflow exists at all with a webhook_secret
      const allSecrets = await db
        .select({ id: workflows.id, secret: workflows.webhookSecret })
        .from(workflows)
        .limit(5);
      console.error("[fire] existing secrets:", JSON.stringify(allSecrets.map(s => ({ id: s.id.substring(0, 8) + "...", secret: s.secret ? s.secret.substring(0, 8) + "..." : null }))));
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    if (!workflow.isActive) {
      return NextResponse.json({ error: "Workflow is not active" }, { status: 400 });
    }

    // Check for concurrent execution
    const [running] = await db
      .select({ id: workflowExecutions.id })
      .from(workflowExecutions)
      .where(and(
        eq(workflowExecutions.workflowId, workflow.id),
        eq(workflowExecutions.status, "running"),
      ))
      .limit(1);

    if (running) {
      return NextResponse.json({ error: "Workflow is already running" }, { status: 409 });
    }

    // Parse request body as execution context
    let context: Record<string, unknown> = {};
    try {
      const body = await req.json();
      if (body && typeof body === "object") {
        context = body;
      }
    } catch {
      // No JSON body — use empty context
    }

    const nodes = (workflow.nodes || []) as any[];
    const edges = (workflow.edges || []) as any[];

    if (nodes.length === 0) {
      return NextResponse.json({ error: "Workflow has no nodes" }, { status: 400 });
    }

    const result = await executeWorkflow(
      workflow.id,
      nodes,
      edges,
      "webhook",
      context,
      workflow.createdBy,
    );

    return NextResponse.json({
      success: result.success,
      status: result.status,
      stepsLog: result.stepsLog,
      error: result.error || null,
    });
  } catch (e) {
    return errorResponse(e);
  }
}

// Also support GET for simpler webhook triggers
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ secret: string }> },
) {
  return POST(req, { params });
}
