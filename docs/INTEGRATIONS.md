# Integrations

## Resend Email

Rovanta.io sends email server-side through Resend.

Required environment variables:

```text
RESEND_API_KEY
RESEND_FROM_EMAIL
```

`RESEND_FROM_EMAIL` must be a verified sender in your Resend account. Do not use `onboarding@resend.dev` in production unless that sender is explicitly allowed for your account and use case.

## Send Email Node

The Send Email node requires:

- `to`
- `subject`
- `body`
- `provider`: `resend`

During preview/mock runs, or when Resend environment variables are missing, Rovanta returns a structured skipped result and does not send email. Live saved workflow runs call Resend only on the server.

Structured results include:

- `sent`: real Resend delivery request succeeded.
- `mocked`: mock-safe validation completed and no email was sent.
- `not_configured`: required Resend env vars are missing and no email was sent.
- `failed`: validation or provider delivery failed.

## Mock-Safe Test Path

Use this endpoint to check Resend wiring without sending email:

```text
GET /api/integrations/resend/test
```

Use this endpoint to validate a sample payload in mock mode:

```text
POST /api/integrations/resend/test
```

The test route always uses mock mode and does not call Resend's send API.

## Safe Error Handling

Resend errors are logged with non-secret error metadata only. The API key is never logged, returned to the client, or stored in workflow configuration.

## Production Notes

- Configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in Vercel Environment Variables.
- Keep `RESEND_API_KEY` server-only. Never prefix it with `NEXT_PUBLIC_`.
- Verify your sending domain before production use.

## Credential Metadata

The `/dashboard/integrations` page stores metadata only:

- provider
- label
- environment variable reference
- connection status

It does not collect, display, return, or log secret values. Real keys must live in Vercel Environment Variables or local `.env.local`.

## Production Credential Encryption Requirement

The MVP intentionally avoids storing user-entered provider secrets because no encryption utility exists yet. Before accepting raw customer API keys, add production-grade secret storage:

- envelope encryption with managed keys
- key rotation plan
- server-only decrypt paths
- audit logging for secret write/read operations
- response filtering so secret values never reach the browser

Until then, store only placeholders or environment variable references.

## Webhook Trigger

Webhook Trigger workflows receive external payloads at:

```text
POST /api/webhooks/[token]
```

The token is generated server-side when a workflow containing a Webhook Trigger is saved. The builder displays the full URL for copying, but users and clients cannot set the token manually.

Webhook execution rules:

- only `active` workflows can run from webhook requests
- request bodies are stored as the workflow run input
- response payload includes only `runId` and `status`
- inactive or missing workflows are rejected
- no provider secrets are logged or returned

## Schedule Trigger

Schedule Trigger workflows are executed by a protected pull endpoint:

```text
GET /api/scheduler
POST /api/scheduler
```

The endpoint checks active workflows whose `next_run_at` is due, executes each workflow, stores a `workflow_runs` record, updates `last_run_at`, and calculates the next `next_run_at`.

Required environment variable:

```text
CRON_SECRET
```

Call the endpoint with:

```text
Authorization: Bearer $CRON_SECRET
```

Example `vercel.json` for Vercel Cron:

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

Vercel Cron sends the `Authorization` header automatically when `CRON_SECRET` is configured. Cron jobs run on production deployments. If your Vercel plan does not support the interval you need, use an external cron service to call the same endpoint with the same bearer token.

Do not deploy an always-running worker for the MVP on Vercel.
