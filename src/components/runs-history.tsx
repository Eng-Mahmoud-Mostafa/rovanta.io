"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, FileText, Play, RotateCcw, X } from "lucide-react";
import { Toast, type ToastTone } from "@/components/toast";
import type { RunHistoryItem, RunHistoryWorkflow } from "@/lib/db/runs";
import type { WorkflowRunStatus } from "@/types/workflow";

type RunFilterStatus = "all" | Extract<WorkflowRunStatus, "success" | "failed" | "running">;

const statuses: RunFilterStatus[] = ["all", "success", "failed", "running"];

function formatDate(value: string | null) {
  if (!value) return "Not finished";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatDuration(run: RunHistoryItem) {
  if (!run.finishedAt) return "In progress";

  const seconds = Math.max(
    1,
    Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)
  );

  return `${seconds}s`;
}

function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function RunsHistory({
  runs,
  workflows,
  source,
  errorMessage,
  initialWorkflowId
}: {
  runs: RunHistoryItem[];
  workflows: RunHistoryWorkflow[];
  source: "database" | "demo" | "empty";
  errorMessage: string | null;
  initialWorkflowId?: string;
}) {
  const router = useRouter();
  const [workflowId, setWorkflowId] = useState(initialWorkflowId ?? "all");
  const [status, setStatus] = useState<RunFilterStatus>("all");
  const [selectedRun, setSelectedRun] = useState<RunHistoryItem | null>(null);
  const [message, setMessage] = useState<{ tone: ToastTone; text: string } | null>(
    errorMessage ? { tone: "error", text: errorMessage } : null
  );
  const [isPending, startTransition] = useTransition();

  const filteredRuns = useMemo(
    () =>
      runs.filter((run) => {
        const workflowMatches = workflowId === "all" || run.workflowId === workflowId;
        const statusMatches = status === "all" || run.status === status;
        return workflowMatches && statusMatches;
      }),
    [runs, status, workflowId]
  );

  useEffect(() => {
    if (!selectedRun) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedRun(null);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedRun]);

  async function retryRun(run: RunHistoryItem) {
    if (run.isDemo) {
      setMessage({ tone: "info", text: "Demo runs cannot be retried. Configure Supabase and integrations to run real workflows." });
      return;
    }

    setMessage(null);

    try {
      const response = await fetch(`/api/workflows/${run.workflowId}/run`, { method: "POST" });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Retry failed.");
      }

      setMessage({ tone: "success", text: "Workflow retry started and run history was updated." });
      startTransition(() => router.refresh());
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Retry failed." });
    }
  }

  return (
    <>
      <header className="dashboard-header">
        <div>
          <p className="muted">Execution history</p>
          <h1>Workflow runs</h1>
          <p className="dashboard-subtitle">
            Review execution status, inspect payloads, and retry failed runs when it is safe.
          </p>
        </div>
        <Link className="button button-primary" href="/dashboard/workflows/new">
          Create workflow
        </Link>
      </header>

      {source === "demo" && (
        <section className="notice-card" role="status">
          <FileText size={18} />
          <div>
            <strong>Demo run history is showing</strong>
            <p>Demo rows are labeled. No real integrations were called.</p>
          </div>
        </section>
      )}

      {message && <Toast tone={message.tone} title="Run history notice" message={message.text} />}

      <section className="workflow-toolbar card" aria-label="Run filters">
        <label>
          <span className="sr-only">Filter by workflow</span>
          <select value={workflowId} onChange={(event) => setWorkflowId(event.target.value)}>
            <option value="all">All workflows</option>
            {workflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>{workflow.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as RunFilterStatus)}>
            {statuses.map((option) => (
              <option key={option} value={option}>{option === "all" ? "All statuses" : option}</option>
            ))}
          </select>
        </label>
      </section>

      {filteredRuns.length > 0 ? (
        <section className="workflow-table card" aria-label="Workflow runs">
          <div className="runs-history-row runs-history-head">
            <span>Workflow</span>
            <span>Status</span>
            <span>Started</span>
            <span>Finished</span>
            <span>Duration</span>
            <span>Actions</span>
          </div>
          {filteredRuns.map((run) => (
            <article className="runs-history-row" key={run.id}>
              <div>
                <strong>{run.workflowName}</strong>
                {run.isDemo && <small className="demo-chip">Demo</small>}
              </div>
              <span className={`status-pill status-${run.status}`}>{run.status}</span>
              <span className="muted">{formatDate(run.startedAt)}</span>
              <span className="muted">{formatDate(run.finishedAt)}</span>
              <span>{formatDuration(run)}</span>
              <div className="run-actions">
                <button type="button" className="button button-secondary" onClick={() => setSelectedRun(run)}>
                  <Eye size={16} /> Details
                </button>
                {run.status === "failed" && (
                  <button type="button" className="button button-secondary" onClick={() => retryRun(run)} disabled={isPending}>
                    <RotateCcw size={16} /> Retry
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="empty-state card">
          <FileText size={36} />
          <h2>No workflow runs found</h2>
          <p className="muted">Run a workflow test from the builder to populate execution history.</p>
          <Link className="button button-primary" href="/dashboard/workflows/new">
            <Play size={16} /> Open builder
          </Link>
        </section>
      )}

      {selectedRun && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedRun(null)}>
          <section
            className="card run-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="run-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="modal-close" type="button" onClick={() => setSelectedRun(null)} aria-label="Close run details">
              <X size={18} />
            </button>
            <span className={`status-pill status-${selectedRun.status}`}>{selectedRun.status}</span>
            <h2 id="run-details-title">{selectedRun.workflowName}</h2>
            <p className="muted">Started {formatDate(selectedRun.startedAt)} - Duration {formatDuration(selectedRun)}</p>

            {selectedRun.errorMessage && (
              <section className="run-error">
                <strong>Error message</strong>
                <p>{selectedRun.errorMessage}</p>
              </section>
            )}

            <section className="json-grid">
              <div>
                <h3>Input JSON</h3>
                <pre>{prettyJson(selectedRun.input)}</pre>
              </div>
              <div>
                <h3>Output JSON</h3>
                <pre>{prettyJson(selectedRun.output)}</pre>
              </div>
            </section>

            {selectedRun.output?.nodeResults && (
              <section className="node-results">
                <h3>Node-level results</h3>
                <pre>{prettyJson(selectedRun.output.nodeResults)}</pre>
              </section>
            )}
          </section>
        </div>
      )}
    </>
  );
}
