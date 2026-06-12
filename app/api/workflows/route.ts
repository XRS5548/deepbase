import { NextRequest, NextResponse } from "next/server";
import { getSession, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { workflows } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await getSession();

    const rows = await db
      .select()
      .from(workflows)
      .where(eq(workflows.createdBy, session.user.id))
      .orderBy(desc(workflows.createdAt));

    // Auto-migrate legacy workflows (steps only) to nodes+edges
    const migrated = rows.map((w) => {
      if ((!w.nodes || (w.nodes as unknown[]).length === 0) && (w.steps as unknown[]).length > 0) {
        return migrateStepsToNodesEdges(w);
      }
      return w;
    });

    return NextResponse.json(migrated);
  } catch (e) {
    return errorResponse(e, 401);
  }
}

function migrateStepsToNodesEdges(w: typeof workflows.$inferSelect) {
  const steps = (w.steps || []) as { id: string; type: string; label: string; config: Record<string, unknown> }[];
  const nodes: unknown[] = [
    {
      id: "trigger",
      type: "trigger",
      position: { x: 300, y: 50 },
      data: { label: "Start", type: "trigger", config: {} },
    },
  ];
  const edges: unknown[] = [];

  steps.forEach((step, index) => {
    const nodeId = step.id;
    nodes.push({
      id: nodeId,
      type: step.type,
      position: { x: 300, y: 200 + index * 180 },
      data: { label: step.label, type: step.type, config: step.config },
    });
    const sourceId = index === 0 ? "trigger" : steps[index - 1].id;
    edges.push({ id: `e-${sourceId}-${nodeId}`, source: sourceId, target: nodeId });
  });

  return { ...w, nodes, edges };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json();

    const { name, description, icon, bgColor } = body;

    if (!name?.trim()) {
      return errorResponse("Name is required");
    }

    // Generate webhook secret and create initial trigger node
    const webhookSecret = crypto.randomUUID();
    const initialNodes = [
      {
        id: "trigger",
        type: "trigger",
        position: { x: 300, y: 50 },
        data: { label: "Start", type: "trigger" as const, config: {} },
      },
    ];

    const [workflow] = await db
      .insert(workflows)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon?.trim() || null,
        bgColor: bgColor || null,
        steps: [],
        nodes: initialNodes,
        edges: [],
        webhookSecret,
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json({ success: true, workflow });
  } catch (e) {
    return errorResponse(e);
  }
}
