import "server-only";

import { demoDashboardRuns, demoDashboardWorkflows } from "@/lib/demo/dashboard";
import { getOptionalEnv } from "@/lib/env";
import { listWorkflowRunsForOwner, listWorkflowsForOwner } from "@/lib/db/workflows";
import type { JsonObject, WorkflowRunStatus } from "@/types/workflow";

export type RunHistoryItem = {
  id: string;
  workflowId: string;
  workflowName: string;
  status: WorkflowRunStatus;
  input: JsonObject;
  output: JsonObject | null;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
  isDemo: boolean;
};

export type RunHistoryWorkflow = {
  id: string;
  name: string;
  isDemo: boolean;
};

export type RunHistoryData = {
  runs: RunHistoryItem[];
  workflows: RunHistoryWorkflow[];
  source: "database" | "demo" | "empty";
  errorMessage: string | null;
};

function databaseConfigured() {
  return Boolean(getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") && getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

function demoData(message: string | null = null): RunHistoryData {
  return {
    source: "demo",
    errorMessage: message,
    workflows: demoDashboardWorkflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      isDemo: true
    })),
    runs: demoDashboardRuns.map((run) => ({
      id: run.id,
      workflowId: run.workflowId,
      workflowName: run.workflowName,
      status: run.status,
      input: { demo: true, source: "demo workspace" },
      output: run.status === "failed"
        ? null
        : {
            demo: true,
            nodeResults: [
              {
                nodeId: "demo-node",
                status: "success",
                output: "Mock result. No real integration was called."
              }
            ]
          },
      errorMessage: run.errorMessage,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      isDemo: true
    }))
  };
}

export async function getRunHistoryData(ownerId: string, workflowId?: string): Promise<RunHistoryData> {
  if (!databaseConfigured()) {
    return demoData("Supabase is not configured. Showing labeled demo run history.");
  }

  try {
    const [runRows, workflowRows] = await Promise.all([
      listWorkflowRunsForOwner(ownerId, workflowId),
      listWorkflowsForOwner(ownerId)
    ]);

    const workflows = workflowRows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      isDemo: false
    }));

    const runs = runRows.map((run) => ({
      id: run.id,
      workflowId: run.workflow_id,
      workflowName: run.workflows.name,
      status: run.status,
      input: run.input,
      output: run.output,
      errorMessage: run.error_message,
      startedAt: run.started_at,
      finishedAt: run.finished_at,
      isDemo: false
    }));

    if (runs.length === 0 && workflows.length === 0) {
      return {
        runs: [],
        workflows: [],
        source: "empty",
        errorMessage: null
      };
    }

    return {
      runs,
      workflows,
      source: "database",
      errorMessage: null
    };
  } catch (error) {
    return demoData(error instanceof Error ? error.message : "Unable to load run history. Showing demo data.");
  }
}
