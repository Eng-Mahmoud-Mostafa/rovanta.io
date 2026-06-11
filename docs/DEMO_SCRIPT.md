# Rovanta.io Demo Script

Use this script to present Rovanta.io in about 3 minutes without real customer data.

## Setup

Use either path:

- No Supabase configured: the app automatically shows labeled demo data for the demo workspace.
- Supabase demo environment: run `supabase/seed.sql` after migrations to load labeled demo rows.

Do not configure real customer credentials for the demo. Resend, Gemini, and webhook examples should remain clearly marked as demo or mock unless you intentionally connect real provider keys in Vercel.

## 3-Minute Walkthrough

### 0:00-0:30 - Positioning

Open `/`.

Say:

> Rovanta.io helps businesses automate repetitive operations with intelligent workflows. The MVP focuses on workflow design, AI recommendations, execution history, integrations, and safe trigger handling.

Click **Start Building** or open `/dashboard`.

### 0:30-1:05 - Dashboard

Show `/dashboard`.

Point out:

- Summary cards: total workflows, active workflows, runs today, failed runs.
- Recent workflow runs.
- Clear **Demo data** labels.
- Quick actions for creating workflows, browsing templates, connecting integrations, and using Rovanta AI.

Say:

> This is demo data. No real customer data or real provider calls are being shown here.

### 1:05-1:45 - Workflows and Builder

Open `/dashboard/workflows`.

Show the three demo workflows:

- Sales Meeting Reminder
- Travel Booking Reminder
- Lead Follow-Up

Open each workflow briefly in the builder:

- Sales Meeting Reminder: schedule trigger to send email.
- Travel Booking Reminder: schedule trigger to customer reminder email.
- Lead Follow-Up: webhook trigger to AI text generation to email.

Say:

> The builder stores nodes, edges, and node configuration. Demo email and AI actions are mock-safe unless provider environment variables are configured.

### 1:45-2:15 - Runs and Integrations

Open `/dashboard/runs`.

Show:

- Successful demo runs.
- Failed demo run with a clear provider-not-configured message.
- Run details with input/output JSON and node-level results.

Open `/dashboard/integrations`.

Say:

> Credentials are metadata-only in the MVP. Real provider secrets belong in Vercel environment variables, not in the browser or database rows.

### 2:15-2:45 - AI Assistant and Templates

Open `/dashboard/ai-assistant`.

Try an example prompt:

```text
Send follow-up emails after sales calls
```

Explain:

> Rovanta AI recommends a workflow and can create a draft when Supabase is configured. If Gemini is not configured, the assistant uses a mock-safe fallback.

Open `/dashboard/templates` and preview a template.

### 2:45-3:00 - Close

Say:

> The demo shows the product flow end to end: choose or generate an automation, inspect it in the builder, run or trigger it safely, and review logs. Production setup requires Supabase migrations plus Vercel environment variables for Clerk, Supabase, Resend, Gemini, and cron.

## Demo Safety Notes

- Demo data is labeled in the UI.
- Mock outputs say no real integration was called.
- Failed demo runs should remain visible to show safe handling of missing provider configuration.
- Do not claim emails, AI responses, webhooks, or scheduled jobs succeeded against real services unless the corresponding Vercel environment variables are configured and verified.
