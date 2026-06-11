import { notFound } from "next/navigation";
import { WorkflowBuilder } from "@/components/workflow-builder";
import { getRequestIdentity } from "@/lib/auth";
import { getWorkflowForOwner } from "@/lib/db/workflows";
import { getDemoBuilderWorkflow, type WorkflowBuilderData } from "@/lib/workflow/builder-data";
import { getOptionalEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

function databaseConfigured() {
  return Boolean(getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") && getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

export default async function ExistingWorkflowBuilderPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!databaseConfigured()) {
    return <WorkflowBuilder initialWorkflow={getDemoBuilderWorkflow(id)} />;
  }

  const identity = await getRequestIdentity();

  try {
    const workflow = await getWorkflowForOwner(identity.userId, id);
    const builderWorkflow: WorkflowBuilderData = {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description ?? "",
      status: workflow.status,
      nodes: workflow.nodes,
      edges: workflow.edges,
      isDemo: false
    };

    return <WorkflowBuilder initialWorkflow={builderWorkflow} />;
  } catch {
    notFound();
  }
}
