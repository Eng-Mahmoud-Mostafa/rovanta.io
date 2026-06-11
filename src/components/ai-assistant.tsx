"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, CirclePlus, Loader2, Send, Sparkles } from "lucide-react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Toast } from "@/components/toast";
import type { AutomationRecommendation } from "@/lib/ai/recommendations";

const examples = [
  "Remind customers before meetings",
  "Send follow-up emails after sales calls",
  "Add leads to Google Sheets",
  "Notify team when a high-value client appears"
];

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function AiAssistant() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Tell me what repetitive operation you want to automate, and I will recommend a workflow draft."
    }
  ]);
  const [recommendation, setRecommendation] = useState<AutomationRecommendation | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitProblem(problem: string) {
    const trimmed = problem.trim();
    if (!trimmed) return;

    setInput("");
    setError(null);
    setIsThinking(true);
    setMessages((current) => [...current, { role: "user", content: trimmed }]);

    try {
      const response = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem: trimmed })
      });
      const result = (await response.json()) as {
        recommendation?: AutomationRecommendation;
        error?: string;
      };

      if (!response.ok || !result.recommendation) {
        throw new Error(result.error ?? "Unable to generate recommendation.");
      }

      const nextRecommendation = result.recommendation;
      setRecommendation(nextRecommendation);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `${nextRecommendation.workflowName}: ${nextRecommendation.explanation}`
        }
      ]);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unable to generate recommendation.";
      setError(message);
      setMessages((current) => [...current, { role: "assistant", content: message }]);
    } finally {
      setIsThinking(false);
    }
  }

  async function createDraftWorkflow() {
    if (!recommendation) return;

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recommendation)
      });
      const result = (await response.json()) as { id?: string; error?: string };

      if (!response.ok || !result.id) {
        throw new Error(result.error ?? "Unable to create draft workflow.");
      }

      router.push(`/dashboard/workflows/${result.id}/builder`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create draft workflow.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="dashboard-page ai-page">
      <DashboardNav />
      <header className="dashboard-header">
        <div>
          <p className="muted">Rovanta AI</p>
          <h1>Automation assistant</h1>
          <p className="dashboard-subtitle">
            Describe a business problem and Rovanta AI will recommend a workflow structure you can turn into a draft.
          </p>
        </div>
        <Link className="button button-secondary" href="/dashboard">
          Back to dashboard
        </Link>
      </header>

      {error && (
        <Toast tone="error" title="Assistant notice" message={error} />
      )}

      <section className="ai-layout">
        <div className="card ai-chat">
          <div className="chat-stream" aria-live="polite">
            {messages.map((message, index) => (
              <article className={`chat-message chat-${message.role}`} key={`${message.role}-${index}`}>
                <span>{message.role === "assistant" ? <Bot size={16} /> : <Sparkles size={16} />}</span>
                <p>{message.content}</p>
              </article>
            ))}
            {isThinking && (
              <article className="chat-message chat-assistant">
                <span><Loader2 size={16} className="spin" /></span>
                <p>Designing a practical workflow recommendation...</p>
              </article>
            )}
          </div>

          <div className="example-grid" aria-label="Example prompts">
            {examples.map((example) => (
              <button type="button" key={example} onClick={() => submitProblem(example)}>
                {example}
              </button>
            ))}
          </div>

          <form
            className="ai-input"
            onSubmit={(event) => {
              event.preventDefault();
              submitProblem(input);
            }}
          >
            <label className="sr-only" htmlFor="ai-problem">Business problem</label>
            <input
              id="ai-problem"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Describe the operation you want to automate..."
            />
            <button className="button button-primary" type="submit" disabled={isThinking || !input.trim()}>
              <Send size={16} /> Send
            </button>
          </form>
        </div>

        <aside className="card recommendation-panel">
          <span className="badge">{recommendation?.source === "gemini" ? "Gemini powered" : "Mock-safe fallback"}</span>
          <h2>{recommendation?.workflowName ?? "Recommended workflow"}</h2>
          {recommendation ? (
            <>
              <div className="recommendation-section">
                <strong>Trigger</strong>
                <p className="muted">{recommendation.trigger}</p>
              </div>
              <div className="recommendation-section">
                <strong>Actions</strong>
                <ul>
                  {recommendation.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
              <div className="recommendation-section">
                <strong>Required integrations</strong>
                <div className="integration-tags">
                  {recommendation.requiredIntegrations.map((integration) => (
                    <span key={integration}>{integration}</span>
                  ))}
                </div>
              </div>
              <p className="muted">{recommendation.explanation}</p>
              <button className="button button-primary" type="button" onClick={createDraftWorkflow} disabled={isCreating}>
                <CirclePlus size={16} /> {isCreating ? "Creating..." : "Create draft workflow"}
              </button>
            </>
          ) : (
            <p className="muted">Your recommendation will appear here after you send a prompt.</p>
          )}
        </aside>
      </section>
    </main>
  );
}
