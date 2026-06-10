import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="auth-page">
      <section className="card auth-card">
        <Link className="brand" href="/">
          <span className="brand-mark">R</span>
          <span>Rovanta.io</span>
        </Link>
        <h1>Sign in</h1>
        <p className="muted">
          Clerk is configured through environment variables. Add your Clerk keys in Vercel to enable hosted authentication.
        </p>
        <Link className="button button-primary" href="/dashboard">Continue to demo dashboard</Link>
      </section>
    </main>
  );
}
