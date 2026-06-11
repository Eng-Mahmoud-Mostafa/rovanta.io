import { NextResponse } from "next/server";
import { executeWorkflow } from "@/lib/workflow/execution";
import type { WorkflowEdge, WorkflowNode } from "@/types/workflow";

type PreviewPayload = {
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PreviewPayload;
    const result = await executeWorkflow({
      nodes: body.nodes ?? [],
      edges: body.edges ?? [],
      input: { preview: true },
      mode: "mock"
    });

    return NextResponse.json(result, { status: result.status === "success" ? 200 : 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Run preview failed.";

    return NextResponse.json(
      { status: "failed", error: message, errorMessage: message },
      { status: 400 }
    );
  }
}
