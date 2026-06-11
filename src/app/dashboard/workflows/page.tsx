import { WorkflowsManagement, type WorkflowListItem } from "@/components/workflows-management";
import { DashboardNav } from "@/components/dashboard-nav";
import { getRequestIdentity } from "@/lib/auth";
import { demoDashboardWorkflows } from "@/lib/demo/dashboard";
import { listWorkflowsForOwner } from "@/lib/db/workflows";
import { getOptionalEnv } from "@/lib/env";
import type { WorkflowStatus } from "@/types/workflow";

export const dynamic = "force-dynamic";

function databaseConfigured() {
  return Boolean(getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") && getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

function toDemoWorkflows(): WorkflowListItem[] {
  return demoDashboardWorkflows.map((workflow) => ({
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    status: workflow.status,
    updatedAt: workflow.updatedAt,
    totalRuns: workflow.totalRuns,
    isDemo: true
  }));
}

export default async function WorkflowsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: WorkflowStatus | "all" }>;
}) {
  const params = await searchParams;
  const search = params.q;
  const status = params.status && params.status !== "all" ? params.status : undefined;

  if (!databaseConfigured()) {
    return (
      <main className="dashboard-page">
        <DashboardNav />
        <WorkflowsManagement
          workflows={toDemoWorkflows()}
          source="demo"
          errorMessage="Supabase is not configured. Showing labeled demo workflows."
        />
      </main>
    );
  }

  try {
    const identity = await getRequestIdentity();
    const workflows = await listWorkflowsForOwner(identity.userId, { search, status });
    const items: WorkflowListItem[] = workflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      updatedAt: workflow.updated_at,
      totalRuns: workflow.total_runs,
      isDemo: false
    }));

    return (
      <main className="dashboard-page">
        <DashboardNav />
        <WorkflowsManagement
          workflows={items.length > 0 ? items : toDemoWorkflows()}
          source={items.length > 0 ? "database" : "demo"}
          errorMessage={items.length > 0 ? null : "No database workflows yet. Showing demo workflows as a preview."}
        />
      </main>
    );
  } catch (error) {
    return (
      <main className="dashboard-page">
        <DashboardNav />
        <WorkflowsManagement
          workflows={toDemoWorkflows()}
          source="demo"
          errorMessage={error instanceof Error ? error.message : "Unable to load workflows. Showing demo data."}
        />
      </main>
    );
  }
}
