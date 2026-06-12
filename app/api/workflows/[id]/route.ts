import { NextRequest, NextResponse } from "next/server";
import { getSession, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { workflows } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const { id } = await params;
    const body = await req.json();

    const [existing] = await db
      .select({ createdBy: workflows.createdBy })
      .from(workflows)
      .where(eq(workflows.id, id));

    if (!existing) return errorResponse("Workflow not found", 404);
    if (existing.createdBy !== session.user.id) return errorResponse("Forbidden", 403);

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.icon !== undefined) updateData.icon = body.icon?.trim() || null;
    if (body.bgColor !== undefined) updateData.bgColor = body.bgColor || null;
    if (body.steps !== undefined) updateData.steps = body.steps;
    if (body.nodes !== undefined) updateData.nodes = body.nodes;
    if (body.edges !== undefined) updateData.edges = body.edges;
    if (body.webhookSecret !== undefined) updateData.webhookSecret = body.webhookSecret;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Dual-write: if nodes+edges are provided, also derive legacy steps
    if (body.nodes !== undefined && body.edges !== undefined) {
      updateData.steps = nodesEdgesToSteps(body.nodes, body.edges);
    }

    updateData.updatedAt = new Date();

    await db.update(workflows).set(updateData).where(eq(workflows.id, id));

    return NextResponse.json({ success: true });
  } catch (e) {
    return errorResponse(e);
  }
}

function nodesEdgesToSteps(
  nodes: { id: string; type: string; data: { label: string; config: Record<string, unknown> } }[],
  _edges: { source: string; target: string }[]
) {
  // Build order from trigger node via BFS
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const ordered: { id: string; type: string; label: string; config: Record<string, unknown> }[] = [];

  // Find trigger, then follow edges to determine order
  const trigger = nodes.find((n) => n.type === "trigger");
  if (!trigger) return [];

  // Simple topological: start from trigger, follow first outgoing edge
  const visited = new Set<string>();
  const queue = [trigger.id];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    const node = nodeMap.get(currentId);
    if (!node) continue;
    if (node.type !== "trigger") {
      ordered.push({
        id: node.id,
        type: node.type,
        label: node.data.label,
        config: node.data.config,
      });
    }
    // Find outgoing edges
    for (const edge of _edges) {
      if (edge.source === currentId && !visited.has(edge.target)) {
        queue.push(edge.target);
      }
    }
  }

  return ordered;
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const { id } = await params;

    const [existing] = await db
      .select({ createdBy: workflows.createdBy })
      .from(workflows)
      .where(eq(workflows.id, id));

    if (!existing) return errorResponse("Workflow not found", 404);
    if (existing.createdBy !== session.user.id) return errorResponse("Forbidden", 403);

    await db.delete(workflows).where(eq(workflows.id, id));

    return NextResponse.json({ success: true });
  } catch (e) {
    return errorResponse(e);
  }
}
