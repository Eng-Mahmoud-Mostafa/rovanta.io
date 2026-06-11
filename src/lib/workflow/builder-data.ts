import type { WorkflowEdge, WorkflowNode, WorkflowStatus } from "@/types/workflow";

export type WorkflowBuilderData = {
  id: string | null;
  name: string;
  description: string;
  status: WorkflowStatus;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  isDemo: boolean;
};

export const emptyBuilderWorkflow: WorkflowBuilderData = {
  id: null,
  name: "Untitled workflow",
  description: "",
  status: "draft",
  nodes: [
    {
      id: "manual-trigger-1",
      type: "manualTrigger",
      label: "Manual Trigger",
      config: {},
      position: { x: 160, y: 180 }
    }
  ],
  edges: [],
  isDemo: false
};

export const demoBuilderWorkflows: WorkflowBuilderData[] = [
  {
  id: "demo-sales-meeting-reminder",
  name: "Sales Meeting Reminder",
  description: "Demo workflow for sending pre-meeting customer reminders.",
  status: "active",
  nodes: [
    {
      id: "schedule-trigger-1",
      type: "scheduleTrigger",
      label: "Daily Schedule",
      config: {
        intervalType: "daily",
        intervalValue: 1,
        timezone: "UTC"
      },
      position: { x: 120, y: 160 }
    },
    {
      id: "send-email-1",
      type: "sendEmail",
      label: "Send Email",
      config: {
        to: "demo@example.com",
        subject: "Meeting reminder",
        body: "This is demo data. Configure Resend before sending real email.",
        provider: "resend"
      },
      position: { x: 460, y: 160 }
    }
  ],
  edges: [
    {
      id: "edge-schedule-email",
      source: "schedule-trigger-1",
      target: "send-email-1"
    }
  ],
  isDemo: true
  },
  {
    id: "demo-travel-booking-reminder",
    name: "Travel Booking Reminder",
    description: "Demo workflow for scheduled travel reminder emails.",
    status: "active",
    nodes: [
      {
        id: "schedule-trigger-1",
        type: "scheduleTrigger",
        label: "Trip Reminder Schedule",
        config: {
          intervalType: "daily",
          intervalValue: 1,
          timezone: "UTC"
        },
        position: { x: 120, y: 160 }
      },
      {
        id: "send-email-1",
        type: "sendEmail",
        label: "Send Customer Reminder",
        config: {
          to: "traveler@example.com",
          subject: "Upcoming trip reminder",
          body: "This is demo data. Configure Resend before sending real customer email.",
          provider: "resend"
        },
        position: { x: 460, y: 160 }
      }
    ],
    edges: [
      {
        id: "edge-schedule-email",
        source: "schedule-trigger-1",
        target: "send-email-1"
      }
    ],
    isDemo: true
  },
  {
    id: "demo-lead-follow-up",
    name: "Lead Follow-Up",
    description: "Demo workflow for webhook-triggered AI follow-up drafts.",
    status: "draft",
    nodes: [
      {
        id: "webhook-trigger-1",
        type: "webhookTrigger",
        label: "New Lead Webhook",
        config: {
          webhookUrl: "/api/webhooks/demo-lead-follow-up-token-000000000000",
          method: "POST"
        },
        position: { x: 80, y: 160 }
      },
      {
        id: "ai-1",
        type: "aiTextGenerate",
        label: "Draft Follow-Up",
        config: {
          provider: "gemini",
          prompt: "Write a concise follow-up email for a new lead. This is a demo prompt.",
          outputVariable: "followUpEmail"
        },
        position: { x: 390, y: 120 }
      },
      {
        id: "send-email-1",
        type: "sendEmail",
        label: "Send Follow-Up",
        config: {
          provider: "resend",
          to: "lead@example.com",
          subject: "Following up",
          body: "{{followUpEmail}}\n\nDemo only. Configure Gemini and Resend before sending real email."
        },
        position: { x: 700, y: 160 }
      }
    ],
    edges: [
      {
        id: "edge-webhook-ai",
        source: "webhook-trigger-1",
        target: "ai-1"
      },
      {
        id: "edge-ai-email",
        source: "ai-1",
        target: "send-email-1"
      }
    ],
    isDemo: true
  }
];

export const demoBuilderWorkflow = demoBuilderWorkflows[0];

export function getDemoBuilderWorkflow(id: string): WorkflowBuilderData {
  return demoBuilderWorkflows.find((workflow) => workflow.id === id) ?? demoBuilderWorkflow;
}
