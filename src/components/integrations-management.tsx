"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, Braces, Cable, KeyRound, Mail, Table2, X } from "lucide-react";
import { Toast, type ToastTone } from "@/components/toast";
import type { IntegrationCardData } from "@/lib/db/integrations";

const iconByProvider = {
  resend: Mail,
  google_sheets: Table2,
  http_api: Braces,
  ai_provider: Bot
};

export function IntegrationsManagement({
  integrations,
  source,
  errorMessage
}: {
  integrations: IntegrationCardData[];
  source: "database" | "demo";
  errorMessage: string | null;
}) {
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = useState<IntegrationCardData | null>(null);
  const [label, setLabel] = useState("");
  const [secretReference, setSecretReference] = useState("");
  const [message, setMessage] = useState<{ tone: ToastTone; text: string } | null>(
    errorMessage ? { tone: "error", text: errorMessage } : null
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!selectedProvider) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedProvider(null);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedProvider]);

  function openModal(integration: IntegrationCardData) {
    setSelectedProvider(integration);
    setLabel(integration.credential?.label ?? `${integration.name} workspace credential`);
    setSecretReference(integration.credential?.secretReference ?? integration.envReference);
    setMessage(null);
  }

  async function saveCredentialMetadata() {
    if (!selectedProvider) return;

    setMessage(null);

    if (!label.trim() || !secretReference.trim()) {
      setMessage({ tone: "error", text: "Credential label and environment variable reference are required." });
      return;
    }

    try {
      const response = await fetch("/api/integrations/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider.provider,
          label: label.trim(),
          secretReference: secretReference.trim()
        })
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save credential metadata.");
      }

      setSelectedProvider(null);
      setMessage({ tone: "success", text: "Credential metadata saved. No secret value was stored." });
      startTransition(() => router.refresh());
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Unable to save credential metadata." });
    }
  }

  return (
    <>
      <header className="dashboard-header">
        <div>
          <p className="muted">Provider setup</p>
          <h1>Integrations</h1>
          <p className="dashboard-subtitle">
            Track provider metadata and connect workflows to environment-backed credentials without exposing secret values.
          </p>
        </div>
      </header>

      {source === "demo" && (
        <section className="notice-card" role="status">
          <Cable size={18} />
          <div>
            <strong>Demo integration metadata</strong>
            <p>Real provider keys must be configured in Vercel Environment Variables.</p>
          </div>
        </section>
      )}

      {message && <Toast tone={message.tone} title="Integration notice" message={message.text} />}

      <section className="integration-grid">
        {integrations.map((integration) => {
          const Icon = iconByProvider[integration.provider];

          return (
            <article className="card integration-card" key={integration.provider}>
              <div className="integration-card-heading">
                <span className="stat-icon"><Icon size={20} /></span>
                <span className={`status-pill status-${integration.status}`}>{integration.status.replace("_", " ")}</span>
              </div>
              <h2>{integration.name}</h2>
              <p className="muted">{integration.description}</p>
              <div className="credential-summary">
                <strong>{integration.credential ? integration.credential.label : "No metadata saved"}</strong>
                <span className="muted">Env reference: {integration.credential?.secretReference ?? integration.envReference}</span>
                <span className="muted">
                  Secret value: {integration.credential?.hasEncryptedSecret ? "Encrypted server-side" : "Not stored in MVP"}
                </span>
              </div>
              <button className="button button-secondary" type="button" onClick={() => openModal(integration)}>
                <KeyRound size={16} /> Add credential metadata
              </button>
            </article>
          );
        })}
      </section>

      {selectedProvider && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedProvider(null)}>
          <section
            className="card credential-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="credential-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="modal-close" type="button" onClick={() => setSelectedProvider(null)} aria-label="Close modal">
              <X size={18} />
            </button>
            <span className="badge">{selectedProvider.name}</span>
            <h2 id="credential-title">Credential metadata</h2>
            <p className="muted">
              Store only a label and environment variable reference. Do not paste API keys here.
            </p>
            <div className="config-form">
              <label>
                <span>Credential label *</span>
                <input value={label} onChange={(event) => setLabel(event.target.value)} required />
              </label>
              <label>
                <span>Environment variable reference *</span>
                <input value={secretReference} onChange={(event) => setSecretReference(event.target.value)} required />
                <small className="field-help">Example: RESEND_API_KEY. The secret value stays in Vercel env vars.</small>
              </label>
            </div>
            <div className="modal-actions">
              <button className="button button-secondary" type="button" onClick={() => setSelectedProvider(null)}>
                Cancel
              </button>
              <button
                className="button button-primary"
                type="button"
                onClick={saveCredentialMetadata}
                disabled={isPending || !label.trim() || !secretReference.trim()}
              >
                Save metadata
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
