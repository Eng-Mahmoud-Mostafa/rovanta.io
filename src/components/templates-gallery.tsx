"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Plus, X } from "lucide-react";
import { Toast } from "@/components/toast";
import {
  workflowTemplateCategories,
  type WorkflowTemplate,
  type WorkflowTemplateCategory
} from "@/lib/workflow/templates";

type TemplateFilter = "All" | WorkflowTemplateCategory;

export function TemplatesGallery({ templates }: { templates: WorkflowTemplate[] }) {
  const router = useRouter();
  const [category, setCategory] = useState<TemplateFilter>("All");
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const filteredTemplates = useMemo(
    () => templates.filter((template) => category === "All" || template.category === category),
    [category, templates]
  );

  useEffect(() => {
    if (!selectedTemplate) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedTemplate(null);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedTemplate]);

  async function handleUseTemplate(template: WorkflowTemplate) {
    setIsCreating(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/templates/${template.id}/use`, { method: "POST" });
      const result = (await response.json()) as { id?: string; error?: string };

      if (!response.ok || !result.id) {
        throw new Error(result.error ?? "Unable to create workflow from template.");
      }

      router.push(`/dashboard/workflows/${result.id}/builder`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create workflow from template.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <>
      <header className="dashboard-header">
        <div>
          <p className="muted">Workflow templates</p>
          <h1>Start from a proven automation</h1>
          <p className="dashboard-subtitle">
            Preview ready-made workflows, then create a draft you can customize in the builder.
          </p>
        </div>
      </header>

      {message && (
        <Toast tone="error" title="Template notice" message={message} />
      )}

      <section className="template-filters" aria-label="Template categories">
        {workflowTemplateCategories.map((option) => (
          <button
            className={option === category ? "active" : ""}
            type="button"
            key={option}
            onClick={() => setCategory(option)}
          >
            {option}
          </button>
        ))}
      </section>

      <section className="template-grid">
        {filteredTemplates.map((template) => (
          <article className="card template-card" key={template.id}>
            <span className="badge">{template.category}</span>
            <h2>{template.name}</h2>
            <p className="muted">{template.description}</p>
            <div className="template-meta">
              <strong>Trigger</strong>
              <span>{template.trigger}</span>
            </div>
            <div className="template-tags">
              {template.requiredIntegrations.map((integration) => (
                <span key={integration}>{integration}</span>
              ))}
            </div>
            <div className="template-actions">
              <button className="button button-secondary" type="button" onClick={() => setSelectedTemplate(template)}>
                <Eye size={16} /> Preview
              </button>
              <button className="button button-primary" type="button" onClick={() => handleUseTemplate(template)} disabled={isCreating}>
                <Plus size={16} /> Use template
              </button>
            </div>
          </article>
        ))}
      </section>

      {selectedTemplate && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedTemplate(null)}>
          <section
            className="card template-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-preview-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="modal-close" type="button" onClick={() => setSelectedTemplate(null)} aria-label="Close preview">
              <X size={18} />
            </button>
            <span className="badge">{selectedTemplate.category}</span>
            <h2 id="template-preview-title">{selectedTemplate.name}</h2>
            <p className="muted">{selectedTemplate.description}</p>
            <div className="preview-flow">
              <div>
                <strong>Trigger</strong>
                <p>{selectedTemplate.trigger}</p>
              </div>
              <div>
                <strong>Actions</strong>
                <ul>
                  {selectedTemplate.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Nodes</strong>
                <ul>
                  {selectedTemplate.nodes.map((node) => (
                    <li key={node.id}>{node.label}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="modal-actions">
              <button className="button button-secondary" type="button" onClick={() => setSelectedTemplate(null)}>
                Close
              </button>
              <button className="button button-primary" type="button" onClick={() => handleUseTemplate(selectedTemplate)} disabled={isCreating}>
                <Plus size={16} /> Use template
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
