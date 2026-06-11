# QA Checklist

Use this checklist before a Vercel production deploy or customer demo.

## Environment And Security

- Confirm `.env`, `.env.local`, and `.env.production` are not committed.
- Confirm `.env.example` contains placeholders only.
- Confirm server-only variables are not prefixed with `NEXT_PUBLIC_`.
- Confirm Vercel has required env vars from `docs/DEPLOYMENT.md`.
- Confirm `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `GEMINI_API_KEY`, `CLERK_SECRET_KEY`, and `CRON_SECRET` are never shown in the browser.

## Build Checks

- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run test`.
- Run `npm run build`.

## Public Pages

- Open `/`.
- Confirm landing page loads on desktop and mobile widths.
- Confirm primary CTA opens sign-in/dashboard flow.
- Confirm no console errors appear.

## Auth

- With Clerk configured, open `/dashboard` while signed out and confirm redirect to sign-in.
- Sign in and confirm redirect to `/dashboard`.
- Open `/sign-in` and `/sign-up` directly.
- With Clerk not configured in a local demo environment, confirm demo workspace access is clearly labeled.

## Dashboard

- Confirm summary cards show real database values or clearly labeled demo values.
- Confirm recent runs table shows demo labels when using demo fallback.
- Confirm quick action links open workflow builder, templates, integrations, and AI assistant.
- Confirm loading and error states render without layout breakage.

## Workflows

- Open `/dashboard/workflows`.
- Search by workflow name.
- Filter by status.
- Open each actions menu using keyboard and mouse.
- Duplicate, activate/pause, and delete real test workflows.
- Confirm demo workflows cannot be mutated and show mock-safe messages.

## Builder

- Open `/dashboard/workflows/new`.
- Add each node type from the node library.
- Connect nodes on the canvas.
- Click each node and edit configuration.
- Try saving with missing required config and confirm clear errors.
- Save a valid workflow and reopen it.
- Run a mock-safe test and confirm result messaging.

## Webhooks

- Create or open a workflow with a Webhook Trigger.
- Save the workflow and confirm a webhook URL appears.
- Copy the webhook URL.
- Confirm inactive workflows are rejected by the webhook endpoint.
- Confirm active webhook runs create `workflow_runs` rows.
- Confirm endpoint responses include `runId` and `status` only.

## Scheduler

- Confirm `CRON_SECRET` is configured in Vercel.
- Call `/api/scheduler` without auth and confirm `401`.
- Call `/api/scheduler` with `Authorization: Bearer $CRON_SECRET`.
- Confirm due active scheduled workflows run.
- Confirm `last_run_at` and `next_run_at` update.
- Confirm no always-running process is required.

## Integrations

- Open `/dashboard/integrations`.
- Confirm credential modal stores metadata only.
- Confirm no secret value is displayed after saving.
- Confirm Resend test endpoint remains mock-safe.
- Confirm missing Resend/Gemini keys produce clear non-secret messages.

## AI Assistant

- Open `/dashboard/ai-assistant`.
- Submit: `Send follow-up emails after sales calls`.
- Confirm response includes workflow name, trigger, actions, integrations, and explanation.
- Create a draft workflow when Supabase is configured.
- Confirm fallback response is labeled when Gemini is not configured.

## Run History

- Open `/dashboard/runs`.
- Filter by workflow and status.
- Open run details.
- Confirm input/output JSON renders.
- Confirm failed demo runs remain clearly marked demo/mock.
- Retry a failed real test run only when safe.

## Accessibility Basics

- Navigate main dashboard controls with keyboard.
- Confirm focus outlines are visible.
- Confirm modals close with Escape.
- Confirm form fields have labels.
- Confirm color contrast is readable in dark mode.
- Confirm mobile layout has no clipped controls or overlapping panels.
