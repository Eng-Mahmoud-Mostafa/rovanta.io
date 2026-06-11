"use client";

import Link from "next/link";

export default function WorkflowsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="dashboard-page">
      <section className="card auth-card" role="alert">
        <span className="badge">Workflow error</span>
        <h1>Unable to load workflows</h1>
        <p className="muted">Check the database configuration or try again.</p>
        <div className="hero-actions">
          <button className="button button-primary" type="button" onClick={reset}>
            Retry
          </button>
          <Link className="button button-secondary" href="/dashboard">
            Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
