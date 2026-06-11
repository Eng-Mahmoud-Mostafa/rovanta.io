import type { WorkflowEdge, WorkflowNode } from "@/types/workflow";

export type WorkflowTemplateCategory = "Sales" | "Travel" | "Healthcare" | "Fitness" | "Operations";

export type WorkflowTemplate = {
  id: string;
  name: string;
  category: WorkflowTemplateCategory;
  description: string;
  trigger: string;
  actions: string[];
  requiredIntegrations: string[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

function edge(id: string, source: string, target: string): WorkflowEdge {
  return { id, source, target };
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "sales-meeting-reminder",
    name: "Sales Meeting Reminder",
    category: "Sales",
    description: "Send a reminder email before sales meetings and preserve a log step for execution history.",
    trigger: "Schedule Trigger",
    actions: ["Send reminder email", "Log result through workflow run history"],
    requiredIntegrations: ["Resend"],
    nodes: [
      {
        id: "schedule-trigger-1",
        type: "scheduleTrigger",
        label: "Schedule Trigger",
        config: { intervalType: "daily", intervalValue: 1, timezone: "UTC" },
        position: { x: 120, y: 180 }
      },
      {
        id: "send-email-1",
        type: "sendEmail",
        label: "Send Email",
        config: {
          provider: "resend",
          to: "",
          subject: "Meeting reminder",
          body: "This is a reminder about your upcoming meeting."
        },
        position: { x: 460, y: 180 }
      }
    ],
    edges: [edge("edge-schedule-email", "schedule-trigger-1", "send-email-1")]
  },
  {
    id: "lead-follow-up",
    name: "Lead Follow-Up",
    category: "Sales",
    description: "Receive a new lead, draft a personalized response with AI, and send the email through Resend.",
    trigger: "Webhook Trigger",
    actions: ["Generate follow-up copy with AI", "Send follow-up email"],
    requiredIntegrations: ["Gemini", "Resend"],
    nodes: [
      {
        id: "webhook-trigger-1",
        type: "webhookTrigger",
        label: "Webhook Trigger",
        config: { webhookUrl: "Generated after save", method: "POST" },
        position: { x: 120, y: 180 }
      },
      {
        id: "ai-text-1",
        type: "aiTextGenerate",
        label: "AI Text Generate",
        config: {
          provider: "gemini",
          prompt: "Write a concise follow-up email for a new sales lead.",
          outputVariable: "followUpEmail"
        },
        position: { x: 460, y: 180 }
      },
      {
        id: "send-email-1",
        type: "sendEmail",
        label: "Send Email",
        config: {
          provider: "resend",
          to: "",
          subject: "Following up",
          body: "{{followUpEmail}}"
        },
        position: { x: 800, y: 180 }
      }
    ],
    edges: [
      edge("edge-webhook-ai", "webhook-trigger-1", "ai-text-1"),
      edge("edge-ai-email", "ai-text-1", "send-email-1")
    ]
  },
  {
    id: "travel-booking-reminder",
    name: "Travel Booking Reminder",
    category: "Travel",
    description: "Send customers a scheduled reminder before a booking or trip date.",
    trigger: "Schedule Trigger",
    actions: ["Send customer reminder email"],
    requiredIntegrations: ["Resend"],
    nodes: [
      {
        id: "schedule-trigger-1",
        type: "scheduleTrigger",
        label: "Schedule Trigger",
        config: { intervalType: "daily", intervalValue: 1, timezone: "UTC" },
        position: { x: 120, y: 180 }
      },
      {
        id: "send-email-1",
        type: "sendEmail",
        label: "Send Email",
        config: {
          provider: "resend",
          to: "",
          subject: "Your upcoming trip",
          body: "This is a reminder about your upcoming booking."
        },
        position: { x: 460, y: 180 }
      }
    ],
    edges: [edge("edge-schedule-email", "schedule-trigger-1", "send-email-1")]
  },
  {
    id: "clinic-appointment-reminder",
    name: "Clinic Appointment Reminder",
    category: "Healthcare",
    description: "Help clinics reduce no-shows with scheduled appointment reminder emails.",
    trigger: "Schedule Trigger",
    actions: ["Send appointment reminder email"],
    requiredIntegrations: ["Resend"],
    nodes: [
      {
        id: "schedule-trigger-1",
        type: "scheduleTrigger",
        label: "Schedule Trigger",
        config: { intervalType: "daily", intervalValue: 1, timezone: "UTC" },
        position: { x: 120, y: 180 }
      },
      {
        id: "send-email-1",
        type: "sendEmail",
        label: "Send Email",
        config: {
          provider: "resend",
          to: "",
          subject: "Appointment reminder",
          body: "This is a reminder about your upcoming appointment."
        },
        position: { x: 460, y: 180 }
      }
    ],
    edges: [edge("edge-schedule-email", "schedule-trigger-1", "send-email-1")]
  },
  {
    id: "gym-lead-follow-up",
    name: "Gym Lead Follow-Up",
    category: "Fitness",
    description: "Follow up with new gym leads after a webhook or manual intake.",
    trigger: "Manual Trigger",
    actions: ["Send membership follow-up email"],
    requiredIntegrations: ["Resend"],
    nodes: [
      {
        id: "manual-trigger-1",
        type: "manualTrigger",
        label: "Manual Trigger",
        config: {},
        position: { x: 120, y: 180 }
      },
      {
        id: "send-email-1",
        type: "sendEmail",
        label: "Send Email",
        config: {
          provider: "resend",
          to: "",
          subject: "Thanks for your interest",
          body: "Thanks for checking out our gym. Here is the next step."
        },
        position: { x: 460, y: 180 }
      }
    ],
    edges: [edge("edge-manual-email", "manual-trigger-1", "send-email-1")]
  },
  {
    id: "high-value-client-alert",
    name: "High-Value Client Alert",
    category: "Operations",
    description: "Receive a webhook, evaluate a high-value condition placeholder, and notify the team.",
    trigger: "Webhook Trigger",
    actions: ["Conditional placeholder", "Send notification email"],
    requiredIntegrations: ["Resend"],
    nodes: [
      {
        id: "webhook-trigger-1",
        type: "webhookTrigger",
        label: "Webhook Trigger",
        config: { webhookUrl: "Generated after save", method: "POST" },
        position: { x: 120, y: 180 }
      },
      {
        id: "condition-1",
        type: "conditionalPlaceholder",
        label: "Conditional Placeholder",
        config: { condition: "clientValue > 10000" },
        position: { x: 460, y: 180 }
      },
      {
        id: "send-email-1",
        type: "sendEmail",
        label: "Send Notification Email",
        config: {
          provider: "resend",
          to: "",
          subject: "High-value client alert",
          body: "A high-value client appeared. Review the source payload."
        },
        position: { x: 800, y: 180 }
      }
    ],
    edges: [
      edge("edge-webhook-condition", "webhook-trigger-1", "condition-1"),
      edge("edge-condition-email", "condition-1", "send-email-1")
    ]
  }
];

export const workflowTemplateCategories = [
  "All",
  "Sales",
  "Travel",
  "Healthcare",
  "Fitness",
  "Operations"
] as const;

export function getWorkflowTemplate(templateId: string) {
  return workflowTemplates.find((template) => template.id === templateId) ?? null;
}
