import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <section className="card auth-card">
        <Link className="brand" href="/">
          <span className="brand-mark">R</span>
          <span>Rovanta.io</span>
        </Link>
        <h1>Create account</h1>
        <p className="muted">
          Add Clerk environment variables in Vercel, then replace this placeholder with Clerk sign-up components.
        </p>
        <Link className="button button-primary" href="/dashboard">Open demo workspace</Link>
      </section>
    </main>
  );
}
