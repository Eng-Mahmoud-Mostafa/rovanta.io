import "server-only";

import { createGeminiClient } from "@/lib/clients/gemini";
import { hasEnv } from "@/lib/env";
import { sendEmailWithResend } from "@/lib/integrations/resend";
import { validateWorkflowNodes } from "@/lib/workflow/node-definitions";
import type { JsonObject, JsonValue, WorkflowEdge, WorkflowNode } from "@/types/workflow";

export type ExecutionMode = "live" | "mock";

export type WorkflowExecutionInput = {
  workflowId?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  input?: JsonObject;
  mode?: ExecutionMode;
};

export type NodeExecutionResult = {
  nodeId: string;
  nodeType: string;
  status: "success" | "failed" | "skipped";
  output: JsonObject | null;
  errorMessage: string | null;
};

export type WorkflowExecutionResult = {
  status: "success" | "failed";
  orderedNodeIds: string[];
  nodeResults: NodeExecutionResult[];
  output: JsonObject;
  errorMessage: string | null;
};

function isTrigger(type: string) {
  return type === "manualTrigger" || type === "scheduleTrigger" || type === "webhookTrigger";
}

function assertJsonObject(value: JsonValue | undefined): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

export function orderWorkflowNodes(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const indegree = new Map(nodes.map((node) => [node.id, 0]));
  const children = new Map<string, string[]>();

  for (const edge of edges) {
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) {
      throw new Error(`Edge ${edge.id} references a missing node.`);
    }

    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
    children.set(edge.source, [...(children.get(edge.source) ?? []), edge.target]);
  }

  const queue = nodes.filter((node) => (indegree.get(node.id) ?? 0) === 0).map((node) => node.id);
  const orderedIds: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift();
    if (!id) continue;
    orderedIds.push(id);

    for (const childId of children.get(id) ?? []) {
      const nextDegree = (indegree.get(childId) ?? 0) - 1;
      indegree.set(childId, nextDegree);
      if (nextDegree === 0) queue.push(childId);
    }
  }

  if (orderedIds.length !== nodes.length) {
    throw new Error("Workflow contains a cycle. Cycles are not supported in the MVP.");
  }

  return orderedIds.map((id) => {
    const node = nodeById.get(id);
    if (!node) throw new Error(`Missing node ${id}.`);
    return node;
  });
}

function getReachableNodeIds(triggerId: string, edges: WorkflowEdge[]) {
  const reachable = new Set<string>([triggerId]);
  const children = new Map<string, string[]>();

  for (const edge of edges) {
    children.set(edge.source, [...(children.get(edge.source) ?? []), edge.target]);
  }

  const queue = [triggerId];

  while (queue.length > 0) {
    const id = queue.shift();
    if (!id) continue;

    for (const childId of children.get(id) ?? []) {
      if (!reachable.has(childId)) {
        reachable.add(childId);
        queue.push(childId);
      }
    }
  }

  return reachable;
}

export function validateWorkflowForExecution(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  const errors = validateWorkflowNodes(nodes);
  const triggers = nodes.filter((node) => isTrigger(node.type));

  if (triggers.length !== 1) {
    errors.push("Workflow must have exactly one trigger node.");
  }

  if (triggers.length === 1) {
    const reachable = getReachableNodeIds(triggers[0].id, edges);

    for (const node of nodes) {
      if (!reachable.has(node.id)) {
        errors.push(`${node.label} must be connected to the trigger path.`);
      }
    }
  } else if (nodes.length > 1 && edges.length === 0) {
    errors.push("Workflow has disconnected nodes. Connect the trigger to at least one action.");
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  const orderedNodes = orderWorkflowNodes(nodes, edges);
  const triggerIndex = orderedNodes.findIndex((node) => isTrigger(node.type));

  if (triggerIndex > 0) {
    return [
      orderedNodes[triggerIndex],
      ...orderedNodes.slice(0, triggerIndex),
      ...orderedNodes.slice(triggerIndex + 1)
    ];
  }

  return orderedNodes;
}

async function executeSendEmail(node: WorkflowNode, mode: ExecutionMode): Promise<NodeExecutionResult> {
  const to = String(node.config.to ?? "").trim();
  const subject = String(node.config.subject ?? "").trim();
  const body = String(node.config.body ?? "").trim();
  const result = await sendEmailWithResend({
    to,
    subject,
    body,
    mode: mode === "mock" ? "mock" : "live"
  });

  return {
    nodeId: node.id,
    nodeType: node.type,
    status: result.ok && result.status === "sent" ? "success" : result.ok ? "skipped" : "failed",
    output: result.output,
    errorMessage: result.errorMessage
  };
}

async function executeHttpRequest(node: WorkflowNode, mode: ExecutionMode): Promise<NodeExecutionResult> {
  const method = String(node.config.method ?? "GET");
  const url = String(node.config.url ?? "").trim();

  if (!url) {
    return {
      nodeId: node.id,
      nodeType: node.type,
      status: "failed",
      output: null,
      errorMessage: "HTTP Request requires a URL."
    };
  }

  if (mode === "mock") {
    return {
      nodeId: node.id,
      nodeType: node.type,
      status: "skipped",
      output: { mock: true, method, url },
      errorMessage: null
    };
  }

  const headers = assertJsonObject(node.config.headers);
  const body = assertJsonObject(node.config.body);
  const response = await fetch(url, {
    method,
    headers: Object.fromEntries(Object.entries(headers).map(([key, value]) => [key, String(value)])),
    body: method === "GET" ? undefined : JSON.stringify(body)
  });
  const text = await response.text();

  return {
    nodeId: node.id,
    nodeType: node.type,
    status: response.ok ? "success" : "failed",
    output: {
      status: response.status,
      body: text.slice(0, 4000)
    },
    errorMessage: response.ok ? null : `HTTP request failed with status ${response.status}.`
  };
}

async function executeAiTextGenerate(node: WorkflowNode, mode: ExecutionMode): Promise<NodeExecutionResult> {
  const prompt = String(node.config.prompt ?? "").trim();

  if (!prompt) {
    return {
      nodeId: node.id,
      nodeType: node.type,
      status: "failed",
      output: null,
      errorMessage: "AI Text Generate requires a prompt."
    };
  }

  if (mode === "mock" || !hasEnv("GEMINI_API_KEY")) {
    return {
      nodeId: node.id,
      nodeType: node.type,
      status: "skipped",
      output: {
        mock: true,
        text: "Mock AI response. Configure GEMINI_API_KEY to call Gemini."
      },
      errorMessage: null
    };
  }

  const model = createGeminiClient().getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);

  return {
    nodeId: node.id,
    nodeType: node.type,
    status: "success",
    output: {
      text: result.response.text()
    },
    errorMessage: null
  };
}

async function executeNode(node: WorkflowNode, mode: ExecutionMode): Promise<NodeExecutionResult> {
  if (isTrigger(node.type)) {
    return {
      nodeId: node.id,
      nodeType: node.type,
      status: "success",
      output: { triggered: true },
      errorMessage: null
    };
  }

  if (node.type === "sendEmail") return executeSendEmail(node, mode);
  if (node.type === "httpRequest") return executeHttpRequest(node, mode);
  if (node.type === "aiTextGenerate") return executeAiTextGenerate(node, mode);

  return {
    nodeId: node.id,
    nodeType: node.type,
    status: "skipped",
    output: { notImplemented: true },
    errorMessage: `${node.label} is not implemented in the MVP execution engine.`
  };
}

export async function executeWorkflow(input: WorkflowExecutionInput): Promise<WorkflowExecutionResult> {
  const orderedNodes = validateWorkflowForExecution(input.nodes, input.edges);
  const mode = input.mode ?? "live";
  const nodeResults: NodeExecutionResult[] = [];

  for (const node of orderedNodes) {
    const result = await executeNode(node, mode);
    nodeResults.push(result);

    if (result.status === "failed") {
      return {
        status: "failed",
        orderedNodeIds: orderedNodes.map((orderedNode) => orderedNode.id),
        nodeResults,
        output: { nodeResults },
        errorMessage: result.errorMessage
      };
    }
  }

  return {
    status: "success",
    orderedNodeIds: orderedNodes.map((node) => node.id),
    nodeResults,
    output: { nodeResults, input: input.input ?? {} },
    errorMessage: null
  };
}
