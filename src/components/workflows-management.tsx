"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CirclePlus, Copy, MoreVertical, Pause, Pencil, Play, Search, Trash2, Workflow } from "lucide-react";
import { Toast, type ToastTone } from "@/components/toast";
import type { WorkflowStatus } from "@/types/workflow";

export type WorkflowListItem = {
  id: string;
  name: string;
  description: string | null;
  status: WorkflowStatus;
  updatedAt: string;
  totalRuns: number;
  isDemo: boolean;
};

type WorkflowsManagementProps = {
  workflows: WorkflowListItem[];
  source: "database" | "demo" | "empty";
  errorMessage: string | null;
};

const statusOptions: Array<"all" | WorkflowStatus> = ["all", "draft", "active", "paused", "error"];

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function nextStatus(status: WorkflowStatus): WorkflowStatus {
  return status === "active" ? "paused" : "active";
}

export function WorkflowsManagement({ workflows, source, errorMessage }: WorkflowsManagementProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | WorkflowStatus>("all");
  const [message, setMessage] = useState<{ tone: ToastTone; text: string } | null>(
    errorMessage ? { tone: "error", text: errorMessage } : null
  );
  const [pendingDelete, setPendingDelete] = useState<WorkflowListItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredWorkflows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return workflows.filter((workflow) => {
      const matchesStatus = status === "all" || workflow.status === status;
      const matchesQuery =
        !normalizedQuery ||
        workflow.name.toLowerCase().includes(normalizedQuery) ||
        workflow.description?.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [query, status, workflows]);

  useEffect(() => {
    if (!pendingDelete) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPendingDelete(null);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pendingDelete]);

  async function runMutation(path: string, init: RequestInit, successMessage: string) {
    setMessage(null);

    try {
      const response = await fetch(path, init);
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Workflow action failed.");
      }

      setMessage({ tone: "success", text: successMessage });
      startTransition(() => router.refresh());
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Workflow action failed." });
    }
  }

  async function duplicateWorkflow(workflow: WorkflowListItem) {
    if (workflow.isDemo) {
      setMessage({ tone: "info", text: "Demo workflows cannot be duplicated until Supabase is configured." });
      return;
    }

    await runMutation(
      `/api/workflows/${workflow.id}/duplicate`,
      { method: "POST" },
      "Workflow duplicated as a draft."
    );
  }

  async function toggleWorkflow(workflow: WorkflowListItem) {
    if (workflow.isDemo) {
      setMessage({ tone: "info", text: "Demo workflows cannot be activated or paused until Supabase is configured." });
      return;
    }

    await runMutation(
      `/api/workflows/${workflow.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus(workflow.status) })
      },
      `Workflow ${workflow.status === "active" ? "paused" : "activated"}.`
    );
  }

  async function deleteWorkflow() {
    if (!pendingDelete) return;

    if (pendingDelete.isDemo) {
      setMessage({ tone: "info", text: "Demo workflows cannot be deleted until Supabase is configured." });
      setPendingDelete(null);
      return;
    }

    const workflow = pendingDelete;
    setPendingDelete(null);
    await runMutation(`/api/workflows/${workflow.id}`, { method: "DELETE" }, "Workflow deleted.");
  }

  return (
    <>
      <header className="dashboard-header">
        <div>
          <p className="muted">Workflow management</p>
          <h1>Workflows</h1>
          <p className="dashboard-subtitle">
            Search, monitor, and manage the automations owned by this workspace.
          </p>
        </div>
        <Link className="button button-primary" href="/dashboard/workflows/new">
          <CirclePlus size={18} /> New workflow
        </Link>
      </header>

      {source === "demo" && (
        <section className="notice-card" role="status">
          <Workflow size={18} />
          <div>
            <strong>Demo workflows are showing</strong>
            <p>Supabase is not configured or no rows exist yet. Actions on demo rows are mock-safe.</p>
          </div>
        </section>
      )}

      {message && <Toast tone={message.tone} title="Workflow notice" message={message.text} />}

      <section className="workflow-toolbar card" aria-label="Workflow filters">
        <label className="search-field">
          <Search size={18} />
          <span className="sr-only">Search workflows</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search workflows..."
          />
        </label>
        <label>
          <span className="sr-only">Filter by status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as "all" | WorkflowStatus)}>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All statuses" : option}
              </option>
            ))}
          </select>
        </label>
      </section>

      {filteredWorkflows.length > 0 ? (
        <section className="workflow-table card" aria-label="Workflows">
          <div className="workflow-table-row workflow-table-head">
            <span>Name</span>
            <span>Status</span>
            <span>Updated</span>
            <span>Runs</span>
            <span>Actions</span>
          </div>
          {filteredWorkflows.map((workflow) => (
            <article className="workflow-table-row" key={workflow.id}>
              <div>
                <strong>{workflow.name}</strong>
                <p className="muted">{workflow.description || "No description yet."}</p>
                {workflow.isDemo && <small className="demo-chip">Demo data</small>}
              </div>
              <span className={`status-pill status-${workflow.status}`}>{workflow.status}</span>
              <span className="muted">{formatUpdatedAt(workflow.updatedAt)}</span>
              <span>{workflow.totalRuns}</span>
              <details className="action-menu">
                <summary aria-label={`Actions for ${workflow.name}`}>
                  <MoreVertical size={18} />
                </summary>
                <div>
                  <Link href={`/dashboard/workflows/${workflow.id}/builder`}>
                    <Pencil size={16} /> Edit
                  </Link>
                  <button type="button" onClick={() => duplicateWorkflow(workflow)} disabled={isPending}>
                    <Copy size={16} /> Duplicate
                  </button>
                  <button type="button" onClick={() => toggleWorkflow(workflow)} disabled={isPending}>
                    {workflow.status === "active" ? <Pause size={16} /> : <Play size={16} />}
                    {workflow.status === "active" ? "Pause" : "Activate"}
                  </button>
                  <button type="button" className="danger-action" onClick={() => setPendingDelete(workflow)}>
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </details>
            </article>
          ))}
        </section>
      ) : (
        <section className="empty-state card">
          <Workflow size={36} />
          <h2>No workflows found</h2>
          <p className="muted">
            {workflows.length === 0
              ? "Create your first workflow to start automating operations."
              : "Adjust your search or status filter to find a workflow."}
          </p>
          <Link className="button button-primary" href="/dashboard/workflows/new">
            <CirclePlus size={18} /> Create workflow
          </Link>
        </section>
      )}

      {pendingDelete && (
        <div className="modal-backdrop" role="presentation" onClick={() => setPendingDelete(null)}>
          <section
            className="card confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-workflow-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-workflow-title">Delete workflow?</h2>
            <p className="muted">
              This will remove <strong>{pendingDelete.name}</strong> and its run history. This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="button button-secondary" type="button" onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
              <button className="button danger-button" type="button" onClick={deleteWorkflow}>
                Delete workflow
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
