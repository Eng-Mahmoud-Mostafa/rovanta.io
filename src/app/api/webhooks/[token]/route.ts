import { NextResponse } from "next/server";
import { createWorkflowRun, getWorkflowByWebhookToken, updateWorkflowRun } from "@/lib/db/workflows";
import { executeWorkflow } from "@/lib/workflow/execution";
import type { JsonObject } from "@/types/workflow";

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

async function readPayload(request: Request): Promise<JsonObject> {
  try {
    const payload = await request.json();
    return isJsonObject(payload) ? payload : { payload: payload === undefined ? null : String(payload) };
  } catch {
    return {};
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  let runId: string | null = null;

  try {
    const { token } = await params;

    if (!token || token.length < 32) {
      return NextResponse.json({ error: "Webhook not found." }, { status: 404 });
    }

    const workflow = await getWorkflowByWebhookToken(token);

    if (workflow.status !== "active") {
      return NextResponse.json({ error: "Workflow is not active." }, { status: 409 });
    }

    const input = await readPayload(request);
    const run = await createWorkflowRun({
      workflowId: workflow.id,
      status: "running",
      input
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

    return NextResponse.json(
      { runId: run.id, status: result.status },
      { status: result.status === "success" ? 200 : 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook execution failed.";

    if (runId) {
      await updateWorkflowRun(runId, {
        status: "failed",
        output: null,
        errorMessage: message,
        finishedAt: new Date().toISOString()
      });

      return NextResponse.json({ runId, status: "failed" }, { status: 400 });
    }

    return NextResponse.json({ error: "Webhook not found." }, { status: 404 });
  }
}
