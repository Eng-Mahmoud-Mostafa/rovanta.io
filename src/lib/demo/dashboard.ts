import type { WorkflowRunStatus, WorkflowStatus } from "@/types/workflow";

export type DashboardWorkflowSummary = {
  id: string;
  name: string;
  description: string | null;
  status: WorkflowStatus;
  updatedAt: string;
  totalRuns: number;
  isDemo: boolean;
};

export type DashboardRunSummary = {
  id: string;
  workflowId: string;
  workflowName: string;
  status: WorkflowRunStatus;
  startedAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
  isDemo: boolean;
};

const now = Date.now();

export const demoDashboardWorkflows: DashboardWorkflowSummary[] = [
  {
    id: "demo-sales-meeting-reminder",
    name: "Sales Meeting Reminder",
    description: "Demo workflow for pre-meeting customer reminders.",
    status: "active",
    updatedAt: new Date(now - 1000 * 60 * 12).toISOString(),
    totalRuns: 8,
    isDemo: true
  },
  {
    id: "demo-travel-booking-reminder",
    name: "Travel Booking Reminder",
    description: "Demo workflow for scheduled trip reminder emails.",
    status: "active",
    updatedAt: new Date(now - 1000 * 60 * 55).toISOString(),
    totalRuns: 3,
    isDemo: true
  },
  {
    id: "demo-lead-follow-up",
    name: "Lead Follow-Up",
    description: "Demo workflow for AI-assisted follow-up emails.",
    status: "draft",
    updatedAt: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
    totalRuns: 1,
    isDemo: true
  }
];

export const demoDashboardRuns: DashboardRunSummary[] = [
  {
    id: "demo-run-1",
    workflowId: "demo-sales-meeting-reminder",
    workflowName: "Sales Meeting Reminder",
    status: "success",
    startedAt: new Date(now - 1000 * 60 * 8).toISOString(),
    finishedAt: new Date(now - 1000 * 60 * 7).toISOString(),
    errorMessage: null,
    isDemo: true
  },
  {
    id: "demo-run-2",
    workflowId: "demo-travel-booking-reminder",
    workflowName: "Travel Booking Reminder",
    status: "success",
    startedAt: new Date(now - 1000 * 60 * 40).toISOString(),
    finishedAt: new Date(now - 1000 * 60 * 39).toISOString(),
    errorMessage: null,
    isDemo: true
  },
  {
    id: "demo-run-3",
    workflowId: "demo-lead-follow-up",
    workflowName: "Lead Follow-Up",
    status: "failed",
    startedAt: new Date(now - 1000 * 60 * 130).toISOString(),
    finishedAt: new Date(now - 1000 * 60 * 129).toISOString(),
    errorMessage: "Demo failure: provider key is not configured. No real integration was called.",
    isDemo: true
  }
];
