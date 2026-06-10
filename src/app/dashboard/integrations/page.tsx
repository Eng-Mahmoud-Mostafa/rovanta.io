import { Bot, BrainCircuit, Mail, Table2 } from "lucide-react";

const integrations = [
  {
    name: "Resend",
    status: "Configured through RESEND_API_KEY",
    icon: Mail
  },
  {
    name: "Supabase",
    status: "Configured through Supabase env vars",
    icon: Table2
  },
  {
    name: "Gemini",
    status: "Configured through GEMINI_API_KEY",
    icon: BrainCircuit
  },
  {
    name: "Clerk",
    status: "Configured through Clerk env vars",
    icon: Bot
  }
];

export default function IntegrationsPage() {
  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="muted">Provider setup</p>
          <h1>Integrations</h1>
        </div>
      </header>
      <section className="workflow-grid">
        {integrations.map(({ name, status, icon: Icon }) => (
          <article className="card workflow-card" key={name}>
            <Icon size={22} />
            <h2>{name}</h2>
            <p className="muted">{status}</p>
            <span className="badge">Server-side env</span>
          </article>
        ))}
      </section>
    </main>
  );
}
