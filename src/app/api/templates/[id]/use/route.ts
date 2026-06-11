import { NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth";
import { createWorkflow } from "@/lib/db/workflows";
import { getOptionalEnv } from "@/lib/env";
import { getWorkflowTemplate } from "@/lib/workflow/templates";

function databaseConfigured() {
  return Boolean(getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") && getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!databaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase is not configured. Template creation is disabled in demo mode." },
        { status: 503 }
      );
    }

    const identity = await getRequestIdentity();
    const { id } = await params;
    const template = getWorkflowTemplate(id);

    if (!template) {
      return NextResponse.json({ error: "Template not found." }, { status: 404 });
    }

    const workflow = await createWorkflow({
      ownerId: identity.userId,
      name: template.name,
      description: template.description,
      status: "draft",
      nodes: template.nodes,
      edges: template.edges
    });

    return NextResponse.json({ id: workflow.id, status: workflow.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to use template." },
      { status: 500 }
    );
  }
}
