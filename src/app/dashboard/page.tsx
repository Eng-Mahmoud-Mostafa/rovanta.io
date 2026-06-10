import Link from "next/link";
import { Activity, Cable, CirclePlus, Clock3, Workflow } from "lucide-react";

const stats = [
  ["Total workflows", "3"],
  ["Active workflows", "2"],
  ["Runs today", "12"],
  ["Failed runs", "0"]
];

const runs = [
  ["Sales Meeting Reminder", "Demo success", "2 minutes ago"],
  ["Travel Booking Reminder", "Demo success", "18 minutes ago"],
  ["Lead Follow-Up", "Demo mock", "1 hour ago"]
];

export default function DashboardPage() {
  return (
    <main className="dashboard">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark">R</span>
          <span>Rovanta.io</span>
        </Link>
        <Link className="active" href="/dashboard"><Activity size={18} /> Overview</Link>
        <Link href="/dashboard/workflows"><Workflow size={18} /> Workflows</Link>
        <Link href="/dashboard/integrations"><Cable size={18} /> Integrations</Link>
      </aside>
      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="muted">Demo workspace</p>
            <h1>Welcome to Rovanta.io</h1>
          </div>
          <Link className="button button-primary" href="/dashboard/workflows/new">
            <CirclePlus size={18} /> Create workflow
          </Link>
        </header>
        <div className="stats-grid">
          {stats.map(([label, value]) => (
            <article className="card stat-card" key={label}>
              <span className="muted">{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
        <section className="card table-card">
          <div className="table-heading">
            <h2>Recent demo runs</h2>
            <span className="badge"><Clock3 size={16} /> Demo data</span>
          </div>
          {runs.map(([workflow, status, time]) => (
            <div className="run-row" key={`${workflow}-${time}`}>
              <span>{workflow}</span>
              <span>{status}</span>
              <span className="muted">{time}</span>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}
