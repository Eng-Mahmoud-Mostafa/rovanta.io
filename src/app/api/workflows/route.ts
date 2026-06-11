import { NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth";
import { createWorkflow } from "@/lib/db/workflows";
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

export async function POST(request: Request) {
  try {
    if (!databaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured. Saving is disabled in demo mode." }, { status: 503 });
    }

    const identity = await getRequestIdentity();
    const body = (await request.json()) as WorkflowPayload;

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Workflow name is required." }, { status: 400 });
    }

    const workflow = await createWorkflow({
      ownerId: identity.userId,
      name: body.name.trim(),
      description: body.description ?? null,
      status: body.status ?? "draft",
      nodes: body.nodes ?? [],
      edges: body.edges ?? []
    });

    return NextResponse.json({
      id: workflow.id,
      status: workflow.status,
      nodes: workflow.nodes,
      webhookPath: workflow.webhook_path
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create workflow." },
      { status: 500 }
    );
  }
}
