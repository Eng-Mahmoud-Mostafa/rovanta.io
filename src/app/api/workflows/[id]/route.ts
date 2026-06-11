import { NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth";
import { deleteWorkflowForOwner, updateWorkflowForOwner } from "@/lib/db/workflows";
import { getOptionalEnv } from "@/lib/env";
import type { WorkflowEdge, WorkflowNode, WorkflowStatus } from "@/types/workflow";

type WorkflowPayload = {
  name?: string;
  description?: string | null;
  status?: WorkflowStatus;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
};

function databaseConfigured() {
  return Boolean(getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") && getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!databaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured. Saving is disabled in demo mode." }, { status: 503 });
    }

    const identity = await getRequestIdentity();
    const { id } = await params;
    const body = (await request.json()) as WorkflowPayload;

    const workflow = await updateWorkflowForOwner(identity.userId, id, {
      name: body.name?.trim(),
      description: body.description,
      status: body.status,
      nodes: body.nodes,
      edges: body.edges
    });

    return NextResponse.json({
      id: workflow.id,
      status: workflow.status,
      nodes: workflow.nodes,
      webhookPath: workflow.webhook_path
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update workflow." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!databaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured. Delete is disabled in demo mode." }, { status: 503 });
    }

    const identity = await getRequestIdentity();
    const { id } = await params;

    await deleteWorkflowForOwner(identity.userId, id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete workflow." },
      { status: 500 }
    );
  }
}
