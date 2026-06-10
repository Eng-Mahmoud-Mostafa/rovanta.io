import Link from "next/link";
import { CirclePlus, Workflow } from "lucide-react";

const demoWorkflows = [
  {
    name: "Sales Meeting Reminder",
    description: "Demo workflow for pre-meeting customer reminders.",
    status: "Demo active"
  },
  {
    name: "Travel Booking Reminder",
    description: "Demo workflow for scheduled trip reminder emails.",
    status: "Demo draft"
  },
  {
    name: "Lead Follow-Up",
    description: "Demo workflow for AI-assisted follow-up emails.",
    status: "Demo mock"
  }
];

export default function WorkflowsPage() {
  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="muted">Workflow management</p>
          <h1>Workflows</h1>
        </div>
        <Link className="button button-primary" href="/dashboard/workflows/new">
          <CirclePlus size={18} /> New workflow
        </Link>
      </header>
      <section className="workflow-grid">
        {demoWorkflows.map((workflow) => (
          <article className="card workflow-card" key={workflow.name}>
            <Workflow size={22} />
            <h2>{workflow.name}</h2>
            <p className="muted">{workflow.description}</p>
            <span className="badge">{workflow.status}</span>
          </article>
        ))}
      </section>
    </main>
  );
}
