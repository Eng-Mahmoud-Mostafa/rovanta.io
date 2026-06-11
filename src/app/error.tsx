"use client";

import Link from "next/link";

export default function RootError({ reset }: { reset: () => void }) {
  return (
    <main className="auth-page">
      <section className="card auth-card" role="alert">
        <span className="badge">Application error</span>
        <h1>Something went wrong</h1>
        <p className="muted">Retry the request, or return home and continue from a stable route.</p>
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
