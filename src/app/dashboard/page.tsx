import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  Cable,
  CirclePlus,
  Clock3,
  FileText,
  LayoutTemplate,
  PlayCircle,
  Workflow,
  Zap
} from "lucide-react";
import { DashboardNav } from "@/components/dashboard-nav";
import { getDashboardIdentity } from "@/lib/auth";
import { getDashboardData } from "@/lib/db/dashboard";
import type { DashboardRunSummary } from "@/lib/demo/dashboard";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  queued: "Queued",
  running: "Running",
  success: "Success",
  failed: "Failed"
};

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  const diff = Date.now() - timestamp;
  const minutes = Math.max(1, Math.round(diff / 60000));

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function formatDuration(run: DashboardRunSummary) {
  if (!run.finishedAt) return "In progress";

  const seconds = Math.max(
    1,
    Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)
  );

  return `${seconds}s`;
}

export default async function DashboardPage() {
  const identity = await getDashboardIdentity();
  const dashboard = await getDashboardData(identity.userId, identity.isDemo);
  const isDemo = dashboard.source === "demo";
  const hasRuns = dashboard.recentRuns.length > 0;

  const stats = [
    {
      label: "Total workflows",
      value: dashboard.summary.totalWorkflows,
      icon: Workflow,
      detail: isDemo ? "Demo workspace" : "Owned by you"
    },
    {
      label: "Active workflows",
      value: dashboard.summary.activeWorkflows,
      icon: Zap,
      detail: "Ready to execute"
    },
    {
      label: "Runs today",
      value: dashboard.summary.runsToday,
      icon: PlayCircle,
      detail: "Since local midnight"
    },
    {
      label: "Failed runs",
      value: dashboard.summary.failedRuns,
      icon: AlertTriangle,
      detail: "Needs review"
    }
  ];

  return (
    <main className="dashboard-page">
      <DashboardNav />

      <section>
        <header className="dashboard-header dashboard-hero">
          <div>
            <p className="muted">{identity.isDemo ? "Demo workspace" : "Authenticated workspace"}</p>
            <h1>Welcome back, {identity.displayName}</h1>
            <p className="dashboard-subtitle">
              Monitor workflow health, review recent executions, and jump into the next automation.
            </p>
          </div>
          <Link className="button button-primary" href="/dashboard/workflows/new">
            <CirclePlus size={18} /> Create workflow
          </Link>
        </header>

        {(isDemo || dashboard.errorMessage) && (
          <section className="notice-card" role="status">
            <AlertTriangle size={18} />
            <div>
              <strong>{isDemo ? "Demo data is showing" : "Dashboard fallback"}</strong>
              <p>{dashboard.errorMessage ?? "This workspace is using labeled demo data. No real integrations were called."}</p>
            </div>
          </section>
        )}

        <section className="stats-grid" aria-label="Workflow summary">
          {stats.map(({ label, value, icon: Icon, detail }) => (
            <article className="card stat-card dashboard-stat" key={label}>
              <div className="stat-icon"><Icon size={20} /></div>
              <span className="muted">{label}</span>
              <strong>{value}</strong>
              <p className="muted">{detail}</p>
            </article>
          ))}
        </section>

        <section className="quick-actions" aria-label="Quick actions">
          <Link className="card quick-action-card" href="/dashboard/workflows/new">
            <CirclePlus size={20} />
            <span>Create workflow</span>
            <small>Start from a blank automation canvas.</small>
          </Link>
          <Link className="card quick-action-card" href="/dashboard/templates">
            <LayoutTemplate size={20} />
            <span>Browse templates</span>
            <small>Use a proven workflow for common operations.</small>
          </Link>
          <Link className="card quick-action-card" href="/dashboard/integrations">
            <Cable size={20} />
            <span>Connect integration</span>
            <small>Configure provider metadata and env-backed keys.</small>
          </Link>
          <Link className="card quick-action-card" href="/dashboard/ai-assistant">
            <Bot size={20} />
            <span>Ask Rovanta AI</span>
            <small>Describe a problem and generate a draft workflow.</small>
          </Link>
        </section>

        <section className="card table-card">
          <div className="table-heading">
            <div>
              <p className="muted">Latest activity</p>
              <h2>Recent workflow runs</h2>
            </div>
            <span className="badge"><Clock3 size={16} /> {isDemo ? "Demo runs" : "Live data"}</span>
          </div>

          {hasRuns ? (
            <div className="runs-table" role="table" aria-label="Recent workflow runs">
              <div className="run-row run-row-head" role="row">
                <span role="columnheader">Workflow</span>
                <span role="columnheader">Status</span>
                <span role="columnheader">Duration</span>
                <span role="columnheader">Started</span>
              </div>
              {dashboard.recentRuns.map((run) => (
                <div className="run-row" role="row" key={run.id}>
                  <span role="cell">
                    {run.workflowName}
                    {run.isDemo && <small className="demo-chip">Demo</small>}
                  </span>
                  <span role="cell" className={`status-pill status-${run.status}`}>
                    {statusLabels[run.status]}
                  </span>
                  <span role="cell" className="muted">{formatDuration(run)}</span>
                  <span role="cell" className="muted">{formatRelativeTime(run.startedAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FileText size={34} />
              <h3>No workflow runs yet</h3>
              <p className="muted">
                Create a workflow and run a test to populate this table with real execution history.
              </p>
              <Link className="button button-secondary" href="/dashboard/workflows/new">
                Create first workflow
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
