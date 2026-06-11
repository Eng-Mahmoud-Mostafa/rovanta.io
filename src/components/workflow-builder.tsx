"use client";

import "@xyflow/react/dist/style.css";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node
} from "@xyflow/react";
import { ArrowLeft, Copy, Play, Save, Zap } from "lucide-react";
import {
  createWorkflowNode,
  nodeDefinitionByType,
  nodeDefinitions,
  validateWorkflowNodeConfig,
  validateWorkflowNodes
} from "@/lib/workflow/node-definitions";
import type { WorkflowBuilderData } from "@/lib/workflow/builder-data";
import type { JsonObject, JsonValue, WorkflowEdge, WorkflowNode, WorkflowStatus } from "@/types/workflow";

type BuilderNodeData = Record<string, unknown> & {
  label: string;
  type: string;
  config: JsonObject;
};

type BuilderFlowNode = Node<BuilderNodeData>;

type BuilderMessage = {
  tone: "success" | "error" | "info";
  text: string;
};

function toFlowNodes(nodes: WorkflowNode[]): BuilderFlowNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: "default",
    position: node.position ?? { x: 120, y: 120 },
    data: {
      label: node.label,
      type: node.type,
      config: node.config
    }
  }));
}

function toFlowEdges(edges: WorkflowEdge[]): Edge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: true
  }));
}

function toWorkflowNodes(nodes: BuilderFlowNode[]): WorkflowNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: node.data.type,
    label: node.data.label,
    config: node.data.config,
    position: node.position
  }));
}

function toWorkflowEdges(edges: Edge[]): WorkflowEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: typeof edge.label === "string" ? edge.label : undefined
  }));
}

function parseJsonField(value: string): JsonValue {
  if (!value.trim()) return {};
  return JSON.parse(value) as JsonValue;
}

function displayReadonlyValue(fieldName: string, value: string) {
  if (fieldName !== "webhookUrl" || !value.startsWith("/api/") || typeof window === "undefined") {
    return value;
  }

  return `${window.location.origin}${value}`;
}

export function WorkflowBuilder({ initialWorkflow }: { initialWorkflow: WorkflowBuilderData }) {
  const router = useRouter();
  const [workflowId, setWorkflowId] = useState<string | null>(initialWorkflow.id);
  const [name, setName] = useState(initialWorkflow.name);
  const [description, setDescription] = useState(initialWorkflow.description);
  const [status, setStatus] = useState<WorkflowStatus>(initialWorkflow.status);
  const [nodes, setNodes, onNodesChange] = useNodesState<BuilderFlowNode>(toFlowNodes(initialWorkflow.nodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState(toFlowEdges(initialWorkflow.edges));
  const [selectedNodeId, setSelectedNodeId] = useState(nodes[0]?.id ?? "");
  const [message, setMessage] = useState<BuilderMessage | null>(
    initialWorkflow.isDemo
      ? { tone: "info", text: "Demo workflow loaded. Saving requires Supabase environment variables." }
      : null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? nodes[0],
    [nodes, selectedNodeId]
  );
  const selectedDefinition = selectedNode ? nodeDefinitionByType.get(selectedNode.data.type) : undefined;
  const selectedNodeErrors = selectedNode
    ? validateWorkflowNodeConfig(toWorkflowNodes([selectedNode])[0])
    : [];

  function onConnect(connection: Connection) {
    setEdges((currentEdges) =>
      addEdge(
        {
          ...connection,
          id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
          animated: true
        },
        currentEdges
      )
    );
  }

  function addNode(type: string) {
    const workflowNode = createWorkflowNode(type, nodes.length + 1);
    setNodes((currentNodes) => [...currentNodes, ...toFlowNodes([workflowNode])]);
    setSelectedNodeId(workflowNode.id);
  }

  function updateSelectedConfig(fieldName: string, value: JsonValue) {
    if (!selectedNode) return;

    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id !== selectedNode.id) return node;

        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              [fieldName]: value
            }
          }
        };
      })
    );
  }

  function validateBeforeAction() {
    const workflowNodes = toWorkflowNodes(nodes);
    const errors = validateWorkflowNodes(workflowNodes);

    if (workflowNodes.length === 0) {
      errors.push("Add at least one node before saving.");
    }

    if (!name.trim()) {
      errors.push("Workflow name is required.");
    }

    if (errors.length > 0) {
      setMessage({ tone: "error", text: errors.join(" ") });
      return null;
    }

    return {
      name: name.trim(),
      description: description.trim() || null,
      status,
      nodes: workflowNodes,
      edges: toWorkflowEdges(edges)
    };
  }

  async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage({ tone: "success", text: "Copied webhook URL." });
    } catch {
      setMessage({ tone: "error", text: "Unable to copy. Select the URL and copy it manually." });
    }
  }

  async function saveWorkflow() {
    const payload = validateBeforeAction();
    if (!payload) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(workflowId ? `/api/workflows/${workflowId}` : "/api/workflows", {
        method: workflowId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as {
        id?: string;
        status?: WorkflowStatus;
        nodes?: WorkflowNode[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save workflow.");
      }

      if (result.id && !workflowId) {
        setWorkflowId(result.id);
        router.replace(`/dashboard/workflows/${result.id}/builder`);
      }

      if (result.status) {
        setStatus(result.status);
      }

      if (result.nodes) {
        setNodes(toFlowNodes(result.nodes));
      }

      setMessage({ tone: "success", text: "Workflow saved." });
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Unable to save workflow." });
    } finally {
      setIsSaving(false);
    }
  }

  async function runTest() {
    const payload = validateBeforeAction();
    if (!payload) return;

    setIsTesting(true);
    setMessage(null);

    try {
      const response = await fetch(workflowId ? `/api/workflows/${workflowId}/run` : "/api/workflows/run-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as {
        status?: string;
        error?: string;
        errorMessage?: string | null;
        nodeResults?: Array<{ nodeId: string; status: string; errorMessage: string | null }>;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Run test failed.");
      }

      const skippedCount = result.nodeResults?.filter((nodeResult) => nodeResult.status === "skipped").length ?? 0;
      const suffix = skippedCount > 0 ? ` ${skippedCount} node(s) were mock/skipped.` : "";
      setMessage({ tone: "success", text: `Run test ${result.status ?? "validated"} successfully.${suffix}` });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Run test failed." });
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <main className="builder-shell">
      <header className="builder-topbar">
        <Link className="button button-secondary" href="/dashboard/workflows">
          <ArrowLeft size={16} /> Back to workflows
        </Link>
        <div className="builder-title-fields">
          <label>
            <span>Workflow name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            <span>Description</span>
            <input value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
        </div>
        <div className="builder-actions">
          <button
            className="button button-secondary"
            type="button"
            onClick={() => setStatus(status === "active" ? "paused" : "active")}
          >
            <Zap size={16} /> {status === "active" ? "Pause" : "Activate"}
          </button>
          <button className="button button-secondary" type="button" onClick={runTest} disabled={isTesting}>
            <Play size={16} /> {isTesting ? "Testing..." : "Run test"}
          </button>
          <button className="button button-primary" type="button" onClick={saveWorkflow} disabled={isSaving}>
            <Save size={16} /> {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      {message && (
        <div
          className={`builder-message builder-message-${message.tone}`}
          role={message.tone === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {message.text}
        </div>
      )}

      <section className="builder-workspace">
        <aside className="node-library" aria-label="Node library">
          <h2>Node library</h2>
          {["Triggers", "Actions", "AI", "Data"].map((category) => (
            <div className="node-category" key={category}>
              <h3>{category}</h3>
              {nodeDefinitions
                .filter((definition) => definition.category === category)
                .map((definition) => (
                  <button
                    className="node-library-item"
                    type="button"
                    key={definition.type}
                    onClick={() => addNode(definition.type)}
                  >
                    <definition.icon size={18} />
                    <span>
                      <strong>{definition.label}</strong>
                      <small>{definition.description}</small>
                    </span>
                  </button>
                ))}
            </div>
          ))}
        </aside>

        <div className="builder-canvas" aria-label="Workflow canvas">
          <ReactFlow<BuilderFlowNode, Edge>
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            fitView
          >
            <Background color="rgba(125, 211, 252, 0.16)" />
            <MiniMap pannable zoomable />
            <Controls />
          </ReactFlow>
        </div>

        <aside className="config-panel" aria-label="Node configuration">
          {selectedNode && selectedDefinition ? (
            <>
              <span className="badge">{selectedDefinition.category}</span>
              <h2>{selectedDefinition.label}</h2>
              <p className="muted">{selectedDefinition.description}</p>
              {selectedNodeErrors.length > 0 && (
                <div className="config-errors" role="status">
                  {selectedNodeErrors.map((error) => (
                    <p key={error}>{error}</p>
                  ))}
                </div>
              )}
              <div className="config-form">
                {selectedDefinition.configSchema.length === 0 && (
                  <p className="muted">This node has no required configuration.</p>
                )}
                {selectedDefinition.configSchema.map((field) => {
                  const rawValue = selectedNode.data.config[field.name];
                  const stringValue =
                    typeof rawValue === "object"
                      ? JSON.stringify(rawValue, null, 2)
                      : String(rawValue ?? "");
                  const readonlyValue = displayReadonlyValue(field.name, stringValue);
                  const fieldError = selectedNodeErrors.find((error) => error.includes(field.label));

                  return (
                    <label key={field.name}>
                      <span>{field.label}{field.required ? " *" : ""}</span>
                      {field.type === "textarea" && (
                        <textarea
                          value={stringValue}
                          placeholder={field.placeholder}
                          required={field.required}
                          aria-invalid={Boolean(fieldError)}
                          onChange={(event) => updateSelectedConfig(field.name, event.target.value)}
                        />
                      )}
                      {field.type === "select" && (
                        <select
                          value={stringValue}
                          required={field.required}
                          aria-invalid={Boolean(fieldError)}
                          onChange={(event) => updateSelectedConfig(field.name, event.target.value)}
                        >
                          {field.options?.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                      {field.type === "number" && (
                        <input
                          type="number"
                          value={stringValue}
                          min={field.min}
                          required={field.required}
                          aria-invalid={Boolean(fieldError)}
                          onChange={(event) => updateSelectedConfig(field.name, Number(event.target.value))}
                        />
                      )}
                      {field.type === "json" && (
                        <textarea
                          value={stringValue}
                          placeholder={field.placeholder ?? "{}"}
                          required={field.required}
                          aria-invalid={Boolean(fieldError)}
                          onChange={(event) => {
                            try {
                              updateSelectedConfig(field.name, parseJsonField(event.target.value));
                            } catch {
                              updateSelectedConfig(field.name, event.target.value);
                            }
                          }}
                        />
                      )}
                      {field.type === "readonly" && (
                        <div className="readonly-copy-field">
                          <input value={readonlyValue} readOnly />
                          <button
                            className="button button-secondary"
                            type="button"
                            onClick={() => copyToClipboard(readonlyValue)}
                            disabled={!readonlyValue || readonlyValue === "Generated after save"}
                            aria-label={`Copy ${field.label}`}
                          >
                            <Copy size={14} /> Copy
                          </button>
                        </div>
                      )}
                      {field.type === "text" && (
                        <input
                          value={stringValue}
                          placeholder={field.placeholder}
                          required={field.required}
                          aria-invalid={Boolean(fieldError)}
                          onChange={(event) => updateSelectedConfig(field.name, event.target.value)}
                        />
                      )}
                      {field.helperText && <small className="field-help">{field.helperText}</small>}
                      {fieldError && <small className="field-error">{fieldError}</small>}
                    </label>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h2>Select a node</h2>
              <p className="muted">Click a node on the canvas to edit its configuration.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
