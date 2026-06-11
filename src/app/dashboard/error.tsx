"use client";

import Link from "next/link";

export default function DashboardError({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="auth-page">
      <section className="card auth-card" role="alert">
        <span className="badge">Dashboard error</span>
        <h1>We could not load the dashboard</h1>
        <p className="muted">{error.message || "Try again, or check the environment configuration."}</p>
        <div className="hero-actions">
          <button className="button button-primary" type="button" onClick={reset}>
            Retry
          </button>
          <Link className="button button-secondary" href="/">
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
