import "server-only";

import { createGeminiClient } from "@/lib/clients/gemini";
import { hasEnv } from "@/lib/env";
import type { WorkflowEdge, WorkflowNode } from "@/types/workflow";

export type AutomationRecommendation = {
  workflowName: string;
  trigger: string;
  actions: string[];
  requiredIntegrations: string[];
  explanation: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  source: "gemini" | "fallback";
};

function buildFallbackRecommendation(problem: string): AutomationRecommendation {
  const lower = problem.toLowerCase();
  const isSheet = lower.includes("sheet");
  const isNotify = lower.includes("notify") || lower.includes("alert");
  const isMeeting = lower.includes("meeting") || lower.includes("appointment") || lower.includes("remind");

  const workflowName = isSheet
    ? "Lead Capture to Sheet"
    : isNotify
      ? "High-Value Client Alert"
      : isMeeting
        ? "Customer Reminder Workflow"
        : "AI Follow-Up Workflow";

  const triggerNode: WorkflowNode = {
    id: "manual-trigger-1",
    type: isMeeting ? "scheduleTrigger" : "manualTrigger",
    label: isMeeting ? "Schedule Trigger" : "Manual Trigger",
    config: isMeeting
      ? { intervalType: "daily", intervalValue: 1, timezone: "UTC" }
      : {},
    position: { x: 120, y: 180 }
  };

  const aiNode: WorkflowNode = {
    id: "ai-text-1",
    type: "aiTextGenerate",
    label: "AI Text Generate",
    config: {
      provider: "gemini",
      prompt: `Draft a concise business automation response for: ${problem}`,
      outputVariable: "generatedMessage"
    },
    position: { x: 430, y: 180 }
  };

  const emailNode: WorkflowNode = {
    id: "send-email-1",
    type: "sendEmail",
    label: "Send Email",
    config: {
      provider: "resend",
      to: "",
      subject: workflowName,
      body: "{{generatedMessage}}"
    },
    position: { x: 740, y: 180 }
  };

  const sheetNode: WorkflowNode = {
    id: "sheet-row-1",
    type: "googleSheetRow",
    label: "Google Sheet Row",
    config: {
      sheetId: "",
      range: "Sheet1!A:D",
      mapping: { message: "{{generatedMessage}}" }
    },
    position: { x: 740, y: 340 }
  };

  const nodes = isSheet ? [triggerNode, aiNode, sheetNode] : [triggerNode, aiNode, emailNode];
  const edges: WorkflowEdge[] = [
    { id: "edge-trigger-ai", source: triggerNode.id, target: aiNode.id },
    { id: "edge-ai-action", source: aiNode.id, target: isSheet ? sheetNode.id : emailNode.id }
  ];

  return {
    workflowName,
    trigger: triggerNode.label,
    actions: isSheet
      ? ["Generate personalized row content", "Append row to Google Sheets placeholder"]
      : ["Generate personalized message", "Send email through Resend"],
    requiredIntegrations: isSheet ? ["Gemini", "Google Sheets placeholder"] : ["Gemini", "Resend"],
    explanation:
      "This draft uses a trigger, an AI text generation step, and an action node. Provider calls stay server-side and real integrations run only after environment variables are configured.",
    nodes,
    edges,
    source: "fallback"
  };
}

function parseRecommendationJson(text: string): Partial<AutomationRecommendation> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]) as Partial<AutomationRecommendation>;
  } catch {
    return null;
  }
}

export async function recommendAutomation(problem: string): Promise<AutomationRecommendation> {
  const trimmedProblem = problem.trim();
  const fallback = buildFallbackRecommendation(trimmedProblem);

  if (!hasEnv("GEMINI_API_KEY")) {
    return fallback;
  }

  try {
    const model = createGeminiClient().getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(`
You are Rovanta AI, an automation architect.
Return only JSON with keys: workflowName, trigger, actions, requiredIntegrations, explanation.
Keep actions practical for an MVP with these node types: Manual Trigger, Schedule Trigger, Webhook Trigger, Send Email, HTTP Request, AI Text Generate, Google Sheet Row placeholder.
Business problem: ${trimmedProblem}
`);
    const parsed = parseRecommendationJson(result.response.text());

    return {
      ...fallback,
      workflowName: parsed?.workflowName || fallback.workflowName,
      trigger: parsed?.trigger || fallback.trigger,
      actions: Array.isArray(parsed?.actions) ? parsed.actions : fallback.actions,
      requiredIntegrations: Array.isArray(parsed?.requiredIntegrations)
        ? parsed.requiredIntegrations
        : fallback.requiredIntegrations,
      explanation: parsed?.explanation || fallback.explanation,
      source: "gemini"
    };
  } catch (error) {
    console.error("Gemini recommendation failed", {
      message: error instanceof Error ? error.message : "Unknown Gemini error"
    });

    return fallback;
  }
}
