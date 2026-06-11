# Vercel Deployment

Rovanta.io is a Next.js App Router application intended for Vercel.

## Project Settings

- Framework preset: Next.js
- Package manager: npm
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: default Next.js output (`.next`)
- Root directory: repository root

No custom output directory is required.

## Required Vercel Environment Variables

Configure these in Vercel Project Settings > Environment Variables. Use real values in Vercel only; do not commit `.env` files.

| Variable | Scope | Required For |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public | Clerk browser authentication |
| `CLERK_SECRET_KEY` | Server-only | Clerk server auth and dashboard protection |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Public | Sign-in route, usually `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Public | Sign-up route, usually `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Public | Login redirect, usually `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Public | Signup redirect, usually `/dashboard` |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase browser/server project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Browser-safe Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Server-side database helpers and API routes |
| `RESEND_API_KEY` | Server-only | Resend email node execution |
| `RESEND_FROM_EMAIL` | Server-only | Verified Resend sender |
| `GEMINI_API_KEY` | Server-only | Rovanta AI recommendations and AI node execution |
| `CRON_SECRET` | Server-only | Protecting `/api/scheduler` |

Server-only variables must not be prefixed with `NEXT_PUBLIC_`.

## Database Setup

Rovanta.io uses Supabase Postgres. Apply migrations before production traffic:

```bash
supabase db push
```

If the Supabase CLI is not available, run the SQL files in order from `supabase/migrations` in the Supabase SQL Editor:

1. `20260610000100_create_workflow_schema.sql`
2. `20260611000100_add_workflow_webhook_tokens.sql`
3. `20260611000200_add_workflow_schedule_fields.sql`

Optional demo data lives in `supabase/seed.sql`. Use it only for demo environments.

## Auth Setup

Clerk protects `/dashboard` routes through `middleware.ts`.

Required Clerk settings:

- Add the Vercel production domain to Clerk allowed origins.
- Configure sign-in URL: `/sign-in`
- Configure sign-up URL: `/sign-up`
- Configure after sign-in/sign-up URL: `/dashboard`
- Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in Vercel.

## Resend Setup

Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in Vercel.

`RESEND_FROM_EMAIL` must be a verified sender/domain in Resend. Do not use `onboarding@resend.dev` for production unless your Resend account explicitly allows it.

Email sending runs only on the server through API routes/workflow execution. The Resend API key is never exposed to the browser.

## Gemini Setup

Set `GEMINI_API_KEY` in Vercel for the Rovanta AI assistant and AI Text Generate node.

If `GEMINI_API_KEY` is missing, AI features fall back to mock-safe responses where implemented instead of exposing secrets.

## Cron Setup

The project includes `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/scheduler",
      "schedule": "0 * * * *"
    }
  ]
}
```

The scheduler endpoint requires:

```text
Authorization: Bearer $CRON_SECRET
```

Configure `CRON_SECRET` in Vercel before enabling production cron. Vercel Cron runs on production deployments. If your Vercel plan does not support the needed interval, use an external cron service to call `https://your-domain.com/api/scheduler` with the same bearer token.

Do not deploy an always-running server process on Vercel.

## Local Verification Before Deploy

Run:

```bash
npm run typecheck
npm run lint
npm run build
```

If a test script exists, run:

```bash
npm run test
```

## Deployment Flow

1. Push the repository to GitHub.
2. Import the GitHub repository into Vercel.
3. Confirm root directory is the repository root.
4. Add the required environment variables.
5. Apply Supabase migrations.
6. Deploy.
7. Verify `/`, `/sign-in`, `/sign-up`, `/dashboard`, `/dashboard/workflows`, `/dashboard/runs`, and `/api/scheduler` authorization behavior.
