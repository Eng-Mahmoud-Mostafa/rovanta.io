import "server-only";

import {
  demoDashboardRuns,
  demoDashboardWorkflows,
  type DashboardRunSummary,
  type DashboardWorkflowSummary
} from "@/lib/demo/dashboard";
import { getOptionalEnv } from "@/lib/env";
import { listWorkflowRunsForOwner, listWorkflowsForOwner } from "@/lib/db/workflows";

export type DashboardSummary = {
  totalWorkflows: number;
  activeWorkflows: number;
  runsToday: number;
  failedRuns: number;
};

export type DashboardData = {
  summary: DashboardSummary;
  workflows: DashboardWorkflowSummary[];
  recentRuns: DashboardRunSummary[];
  source: "database" | "demo" | "empty";
  errorMessage: string | null;
};

function hasSupabaseServerConfig() {
  return Boolean(
    getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") &&
      getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY")
  );
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function buildSummary(workflows: DashboardWorkflowSummary[], runs: DashboardRunSummary[]): DashboardSummary {
  const today = startOfToday();

  return {
    totalWorkflows: workflows.length,
    activeWorkflows: workflows.filter((workflow) => workflow.status === "active").length,
    runsToday: runs.filter((run) => new Date(run.startedAt) >= today).length,
    failedRuns: runs.filter((run) => run.status === "failed").length
  };
}

export async function getDashboardData(ownerId: string, useDemoFallback: boolean): Promise<DashboardData> {
  if (!hasSupabaseServerConfig()) {
    const workflows = useDemoFallback ? demoDashboardWorkflows : [];
    const recentRuns = useDemoFallback ? demoDashboardRuns : [];

    return {
      summary: buildSummary(workflows, recentRuns),
      workflows,
      recentRuns,
      source: useDemoFallback ? "demo" : "empty",
      errorMessage: useDemoFallback ? "Supabase is not configured. Showing demo data." : null
    };
  }

  try {
    const [workflowRows, runRows] = await Promise.all([
      listWorkflowsForOwner(ownerId),
      listWorkflowRunsForOwner(ownerId)
    ]);

    const workflows: DashboardWorkflowSummary[] = workflowRows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      updatedAt: workflow.updated_at,
      totalRuns: workflow.total_runs,
      isDemo: false
    }));

    const recentRuns: DashboardRunSummary[] = runRows.slice(0, 6).map((run) => ({
      id: run.id,
      workflowId: run.workflow_id,
      workflowName: run.workflows.name,
      status: run.status,
      startedAt: run.started_at,
      finishedAt: run.finished_at,
      errorMessage: run.error_message,
      isDemo: false
    }));

    const noData = workflows.length === 0 && recentRuns.length === 0;
    const fallbackWorkflows = noData && useDemoFallback ? demoDashboardWorkflows : workflows;
    const fallbackRuns = noData && useDemoFallback ? demoDashboardRuns : recentRuns;

    return {
      summary: buildSummary(fallbackWorkflows, fallbackRuns),
      workflows: fallbackWorkflows,
      recentRuns: fallbackRuns,
      source: noData ? (useDemoFallback ? "demo" : "empty") : "database",
      errorMessage: noData && useDemoFallback ? "No database rows yet. Showing demo data." : null
    };
  } catch (error) {
    const workflows = useDemoFallback ? demoDashboardWorkflows : [];
    const recentRuns = useDemoFallback ? demoDashboardRuns : [];

    return {
      summary: buildSummary(workflows, recentRuns),
      workflows,
      recentRuns,
      source: useDemoFallback ? "demo" : "empty",
      errorMessage: error instanceof Error ? error.message : "Unable to load dashboard data."
    };
  }
}
