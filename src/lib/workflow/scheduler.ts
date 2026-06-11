import "server-only";

import {
  createWorkflowRun,
  listDueScheduledWorkflows,
  updateWorkflowRun,
  updateWorkflowScheduleAfterRun
} from "@/lib/db/workflows";
import { executeWorkflow } from "@/lib/workflow/execution";
import type { JsonObject, WorkflowRunStatus } from "@/types/workflow";

export type ScheduledWorkflowRunResult = {
  workflowId: string;
  runId: string | null;
  status: WorkflowRunStatus | "skipped";
  errorMessage: string | null;
};

export type SchedulerResult = {
  checkedAt: string;
  dueCount: number;
  executedCount: number;
  failedCount: number;
  results: ScheduledWorkflowRunResult[];
};

export async function runDueScheduledWorkflows(options?: { limit?: number; now?: Date }): Promise<SchedulerResult> {
  const now = options?.now ?? new Date();
  const dueWorkflows = await listDueScheduledWorkflows(now, options?.limit ?? 10);
  const results: ScheduledWorkflowRunResult[] = [];

  for (const workflow of dueWorkflows) {
    let runId: string | null = null;
    const startedAt = new Date().toISOString();
    const input: JsonObject = {
      scheduled: true,
      dueAt: workflow.next_run_at ?? startedAt,
      triggeredAt: startedAt
    };

    try {
      const run = await createWorkflowRun({
        workflowId: workflow.id,
        status: "running",
        input,
        startedAt
      });
      runId = run.id;

      const result = await executeWorkflow({
        workflowId: workflow.id,
        nodes: workflow.nodes,
        edges: workflow.edges,
        input,
        mode: "live"
      });

      await updateWorkflowRun(run.id, {
        status: result.status,
        output: result.output,
        errorMessage: result.errorMessage,
        finishedAt: new Date().toISOString()
      });

      await updateWorkflowScheduleAfterRun(workflow.id, {
        scheduleConfig: workflow.schedule_config,
        ranAt: startedAt
      });

      results.push({
        workflowId: workflow.id,
        runId: run.id,
        status: result.status,
        errorMessage: result.errorMessage
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Scheduled workflow failed.";

      if (runId) {
        await updateWorkflowRun(runId, {
          status: "failed",
          output: null,
          errorMessage,
          finishedAt: new Date().toISOString()
        });
      }

      await updateWorkflowScheduleAfterRun(workflow.id, {
        scheduleConfig: workflow.schedule_config,
        ranAt: startedAt
      });

      results.push({
        workflowId: workflow.id,
        runId,
        status: "failed",
        errorMessage
      });
    }
  }

  return {
    checkedAt: now.toISOString(),
    dueCount: dueWorkflows.length,
    executedCount: results.filter((result) => result.status === "success").length,
    failedCount: results.filter((result) => result.status === "failed").length,
    results
  };
}
