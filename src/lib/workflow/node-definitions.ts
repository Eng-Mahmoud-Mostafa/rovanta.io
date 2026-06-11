import {
  Bot,
  CalendarClock,
  FileSpreadsheet,
  Globe2,
  Mail,
  MousePointer2,
  Webhook
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { JsonObject, WorkflowNode, WorkflowNodeConfig } from "@/types/workflow";

export type WorkflowNodeCategory = "Triggers" | "Actions" | "AI" | "Data";

export type WorkflowNodeField = {
  name: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "json" | "readonly";
  required?: boolean;
  options?: string[];
  placeholder?: string;
  min?: number;
  helperText?: string;
};

export type WorkflowNodeDefinition = {
  type: string;
  label: string;
  description: string;
  category: WorkflowNodeCategory;
  icon: LucideIcon;
  configSchema: WorkflowNodeField[];
  defaultConfig: WorkflowNodeConfig;
};

export const nodeDefinitions: WorkflowNodeDefinition[] = [
  {
    type: "manualTrigger",
    label: "Manual Trigger",
    description: "Start the workflow manually from the builder.",
    category: "Triggers",
    icon: MousePointer2,
    configSchema: [],
    defaultConfig: {}
  },
  {
    type: "scheduleTrigger",
    label: "Schedule Trigger",
    description: "Run on a recurring schedule.",
    category: "Triggers",
    icon: CalendarClock,
    configSchema: [
      { name: "intervalType", label: "Interval type", type: "select", required: true, options: ["minutes", "hourly", "daily", "weekly"] },
      { name: "intervalValue", label: "Interval value", type: "number", required: true, min: 1 },
      { name: "timezone", label: "Timezone", type: "text", required: true, placeholder: "UTC" }
    ],
    defaultConfig: {
      intervalType: "daily",
      intervalValue: 1,
      timezone: "UTC"
    }
  },
  {
    type: "webhookTrigger",
    label: "Webhook Trigger",
    description: "Receive an external POST request to start a workflow.",
    category: "Triggers",
    icon: Webhook,
    configSchema: [
      { name: "webhookUrl", label: "Webhook URL", type: "readonly", helperText: "Generated after the workflow is saved with a webhook token." },
      { name: "method", label: "Method", type: "select", required: true, options: ["POST"] }
    ],
    defaultConfig: {
      webhookUrl: "Generated after save",
      method: "POST"
    }
  },
  {
    type: "sendEmail",
    label: "Send Email",
    description: "Send an email through Resend.",
    category: "Actions",
    icon: Mail,
    configSchema: [
      { name: "to", label: "To", type: "text", required: true, placeholder: "customer@example.com" },
      { name: "subject", label: "Subject", type: "text", required: true },
      { name: "body", label: "Body", type: "textarea", required: true },
      { name: "provider", label: "Provider", type: "select", required: true, options: ["resend"] }
    ],
    defaultConfig: {
      to: "",
      subject: "",
      body: "",
      provider: "resend"
    }
  },
  {
    type: "httpRequest",
    label: "HTTP Request",
    description: "Call an external API endpoint.",
    category: "Actions",
    icon: Globe2,
    configSchema: [
      { name: "method", label: "Method", type: "select", required: true, options: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
      { name: "url", label: "URL", type: "text", required: true, placeholder: "https://api.example.com" },
      { name: "headers", label: "Headers JSON", type: "json", helperText: "Must be a JSON object. Example: {\"Authorization\":\"Bearer token\"}" },
      { name: "body", label: "Body JSON", type: "json", helperText: "Must be a JSON object." }
    ],
    defaultConfig: {
      method: "GET",
      url: "",
      headers: {},
      body: {}
    }
  },
  {
    type: "aiTextGenerate",
    label: "AI Text Generate",
    description: "Generate text with the configured AI provider.",
    category: "AI",
    icon: Bot,
    configSchema: [
      { name: "prompt", label: "Prompt", type: "textarea", required: true },
      { name: "provider", label: "Provider", type: "select", required: true, options: ["gemini"] },
      { name: "outputVariable", label: "Output variable name", type: "text", required: true, placeholder: "generatedText" }
    ],
    defaultConfig: {
      prompt: "",
      provider: "gemini",
      outputVariable: "generatedText"
    }
  },
  {
    type: "googleSheetRow",
    label: "Google Sheet Row",
    description: "Placeholder for writing a row to Google Sheets.",
    category: "Data",
    icon: FileSpreadsheet,
    configSchema: [
      { name: "sheetId", label: "Sheet ID", type: "text", required: true },
      { name: "range", label: "Range", type: "text", required: true, placeholder: "Sheet1!A:D" },
      { name: "mapping", label: "Mapping JSON", type: "json", required: true, helperText: "Must be a JSON object mapping sheet columns to workflow values." }
    ],
    defaultConfig: {
      sheetId: "",
      range: "",
      mapping: {}
    }
  }
];

export const nodeDefinitionByType = new Map(nodeDefinitions.map((definition) => [definition.type, definition]));

export function createWorkflowNode(type: string, index: number): WorkflowNode {
  const definition = nodeDefinitionByType.get(type);

  if (!definition) {
    throw new Error(`Unsupported node type: ${type}`);
  }

  return {
    id: `${type}-${Date.now()}-${index}`,
    type,
    label: definition.label,
    config: structuredClone(definition.defaultConfig),
    position: {
      x: 120 + index * 38,
      y: 120 + index * 42
    }
  };
}

export function validateWorkflowNodes(nodes: WorkflowNode[]) {
  return nodes.flatMap((node) => validateWorkflowNodeConfig(node));
}

export function validateWorkflowNodeConfig(node: WorkflowNode) {
  const errors: string[] = [];
  const definition = nodeDefinitionByType.get(node.type);

  if (!definition) {
    return [`${node.label || node.id}: unsupported node type.`];
  }

  for (const field of definition.configSchema) {
    const value = node.config[field.name];
    const missing =
      value === undefined ||
      value === null ||
      value === "" ||
      (field.type === "json" &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.keys(value as JsonObject).length === 0);

    if (field.required && missing) {
      errors.push(`${definition.label}: ${field.label} is required.`);
      continue;
    }

    if (!field.required && missing) continue;

    if (field.type === "select" && field.options && typeof value === "string" && !field.options.includes(value)) {
      errors.push(`${definition.label}: ${field.label} must be one of ${field.options.join(", ")}.`);
    }

    if (field.type === "number") {
      const numericValue = typeof value === "number" ? value : Number(value);

      if (!Number.isFinite(numericValue)) {
        errors.push(`${definition.label}: ${field.label} must be a valid number.`);
      } else if (field.min !== undefined && numericValue < field.min) {
        errors.push(`${definition.label}: ${field.label} must be at least ${field.min}.`);
      }
    }

    if (field.type === "json" && (typeof value !== "object" || Array.isArray(value))) {
      errors.push(`${definition.label}: ${field.label} must be a valid JSON object.`);
    }
  }

  return errors;
}
