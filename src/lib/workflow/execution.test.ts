import { describe, expect, it } from "vitest";
import { executeWorkflow, orderWorkflowNodes, validateWorkflowForExecution } from "@/lib/workflow/execution";
import { validateWorkflowNodeConfig } from "@/lib/workflow/node-definitions";
import type { WorkflowEdge, WorkflowNode } from "@/types/workflow";

const manualTrigger: WorkflowNode = {
  id: "trigger",
  type: "manualTrigger",
  label: "Manual Trigger",
  config: {}
};

const emailNode: WorkflowNode = {
  id: "email",
  type: "sendEmail",
  label: "Send Email",
  config: {
    provider: "resend",
    to: "customer@example.com",
    subject: "Reminder",
    body: "This is a mock-safe test email."
  }
};

const httpNode: WorkflowNode = {
  id: "http",
  type: "httpRequest",
  label: "HTTP Request",
  config: {
    method: "POST",
    url: "https://example.com/api",
    headers: {},
    body: {}
  }
};

const edges: WorkflowEdge[] = [
  { id: "edge-trigger-email", source: "trigger", target: "email" },
  { id: "edge-email-http", source: "email", target: "http" }
];

describe("workflow execution engine", () => {
  it("orders workflow nodes topologically from trigger through actions", () => {
    const ordered = orderWorkflowNodes([httpNode, emailNode, manualTrigger], edges);

    expect(ordered.map((node) => node.id)).toEqual(["trigger", "email", "http"]);
  });

  it("validates one connected trigger path", () => {
    const ordered = validateWorkflowForExecution([manualTrigger, emailNode, httpNode], edges);

    expect(ordered.map((node) => node.id)).toEqual(["trigger", "email", "http"]);
  });

  it("rejects workflows with disconnected required nodes", () => {
    expect(() => validateWorkflowForExecution([manualTrigger, emailNode], [])).toThrow(
      "Send Email must be connected to the trigger path."
    );
  });

  it("reports missing node configuration errors", () => {
    const invalidEmailNode: WorkflowNode = {
      ...emailNode,
      config: {
        provider: "resend",
        to: "",
        subject: "",
        body: ""
      }
    };

    expect(validateWorkflowNodeConfig(invalidEmailNode)).toEqual([
      "Send Email: To is required.",
      "Send Email: Subject is required.",
      "Send Email: Body is required."
    ]);
  });

  it("executes the email node in mock mode without sending real email", async () => {
    const result = await executeWorkflow({
      nodes: [manualTrigger, emailNode],
      edges: [{ id: "edge-trigger-email", source: "trigger", target: "email" }],
      input: { demo: true },
      mode: "mock"
    });

    expect(result.status).toBe("success");
    expect(result.orderedNodeIds).toEqual(["trigger", "email"]);
    expect(result.nodeResults[1]).toMatchObject({
      nodeId: "email",
      nodeType: "sendEmail",
      status: "skipped",
      output: {
        mock: true,
        provider: "resend",
        to: "customer@example.com"
      }
    });
  });
});
