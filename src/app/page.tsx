import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Bot, BrainCircuit, Cable, CheckCircle2, Clock3, ShieldCheck, Workflow, Zap } from "lucide-react";

const problems = ["Manual follow-ups", "Disconnected tools", "Missed handoffs"];
const features: Array<{ label: string; icon: LucideIcon }> = [
  { label: "Visual workflow builder", icon: Workflow },
  { label: "Smart triggers", icon: Zap },
  { label: "AI recommendations", icon: BrainCircuit },
  { label: "Email automation", icon: Bot },
  { label: "CRM and data sync", icon: Cable },
  { label: "Logs and monitoring", icon: ShieldCheck }
];
const useCases = ["Sales teams", "Travel agencies", "Clinics", "Gyms", "Small businesses"];

export default function Home() {
  return (
    <main>
      <nav className="container nav">
        <Link className="brand" href="/">
          <span className="brand-mark">R</span>
          <span>Rovanta.io</span>
        </Link>
        <div className="nav-actions">
          <Link href="/sign-in">Sign in</Link>
          <Link className="button button-primary" href="/dashboard">Start Building</Link>
        </div>
      </nav>

      <section className="container hero">
        <div className="hero-copy">
          <span className="badge">
            <BrainCircuit size={16} />
            AI workflow automation
          </span>
          <h1>Automate work with intelligent workflows</h1>
          <p>
            Rovanta.io helps teams connect tools, automate repetitive operations, and build smart workflows that recommend the next best action.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/dashboard">
              Start Building <ArrowRight size={18} />
            </Link>
            <a className="button button-secondary" href="#demo">View Demo</a>
          </div>
        </div>
        <div className="hero-panel card" aria-label="Workflow preview">
          <div className="node trigger">
            <Clock3 size={18} /> Schedule Trigger
          </div>
          <div className="connector" />
          <div className="node">
            <BrainCircuit size={18} /> AI Recommendation
          </div>
          <div className="connector" />
          <div className="node">
            <Bot size={18} /> Send Follow-up
          </div>
          <div className="run-status">
            <CheckCircle2 size={18} /> Demo run completed in 1.8s
          </div>
        </div>
      </section>

      <section className="container grid-section">
        {problems.map((problem) => (
          <article className="card problem-card" key={problem}>
            <span>Problem</span>
            <h2>{problem}</h2>
            <p className="muted">Replace scattered manual work with repeatable, observable automation.</p>
          </article>
        ))}
      </section>

      <section className="container split-section" id="demo">
        <div>
          <span className="badge">Solution</span>
          <h2>Build, run, and monitor intelligent workflows</h2>
          <p className="muted">
            Start with templates, connect integrations, let AI draft workflow steps, and keep every execution visible in logs.
          </p>
        </div>
        <div className="feature-list">
          {features.slice(0, 4).map(({ label }) => (
            <div className="feature-row" key={label}>
              <CheckCircle2 size={18} />
              {label}
            </div>
          ))}
        </div>
      </section>

      <section className="container feature-grid">
        {features.map(({ label, icon: Icon }) => (
          <article className="card feature-card" key={label}>
            <Icon size={22} />
            <h3>{label}</h3>
            <p className="muted">Production-minded automation primitives for a practical MVP.</p>
          </article>
        ))}
      </section>

      <section className="container use-cases card">
        <h2>Designed for operational teams</h2>
        <div>
          {useCases.map((useCase) => (
            <span key={useCase}>{useCase}</span>
          ))}
        </div>
      </section>

      <section className="container pricing">
        <div>
          <span className="badge">Pricing preview</span>
          <h2>Start lean, scale as workflows grow</h2>
          <p className="muted">MVP pricing can launch with a simple workspace plan and usage limits for workflow runs.</p>
        </div>
        <Link className="button button-primary" href="/dashboard">Create your first workflow</Link>
      </section>

      <footer className="container footer">
        <span>Rovanta.io</span>
        <span className="muted">AI workflow automation platform</span>
      </footer>
    </main>
  );
}
