import Link from "next/link";

export default function NewWorkflowPage() {
  return (
    <main className="dashboard-page">
      <section className="card auth-card">
        <span className="badge">Builder foundation</span>
        <h1>Create workflow</h1>
        <p className="muted">
          This route is ready for the visual workflow builder. Demo data is clearly labeled and real integrations should run only after Vercel environment variables are configured.
        </p>
        <Link className="button button-secondary" href="/dashboard/workflows">Back to workflows</Link>
      </section>
    </main>
  );
}
