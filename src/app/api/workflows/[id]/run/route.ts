import { NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth";
import { createWorkflowRun, getWorkflowForOwner, updateWorkflowRun } from "@/lib/db/workflows";
import { executeWorkflow } from "@/lib/workflow/execution";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let runId: string | null = null;

  try {
    const identity = await getRequestIdentity();
    const { id } = await params;
    const workflow = await getWorkflowForOwner(identity.userId, id);
    const run = await createWorkflowRun({
      workflowId: workflow.id,
      status: "running",
      input: { manualTest: true }
    });
    runId = run.id;

    const result = await executeWorkflow({
      workflowId: workflow.id,
      nodes: workflow.nodes,
      edges: workflow.edges,
      input: { manualTest: true },
      mode: "live"
    });

    await updateWorkflowRun(run.id, {
      status: result.status,
      output: result.output,
      errorMessage: result.errorMessage,
      finishedAt: new Date().toISOString()
    });

    return NextResponse.json({ runId: run.id, ...result }, { status: result.status === "success" ? 200 : 400 });
  } catch (error) {
    if (runId) {
      await updateWorkflowRun(runId, {
        status: "failed",
        output: null,
        errorMessage: error instanceof Error ? error.message : "Workflow run failed.",
        finishedAt: new Date().toISOString()
      });
    }

    const message = error instanceof Error ? error.message : "Workflow run failed.";

    return NextResponse.json(
      { runId, status: "failed", error: message, errorMessage: message },
      { status: 400 }
    );
  }
}
