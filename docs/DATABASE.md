# Database

Rovanta.io uses Supabase Postgres. Schema changes are stored as SQL migrations in `supabase/migrations`.

## Tables

### `profiles`

Stores one profile per authenticated user.

- `id`: text primary key, expected to match the authenticated JWT subject.
- `email`
- `full_name`
- `avatar_url`
- `created_at`
- `updated_at`

### `workflows`

Stores saved workflow definitions.

- `id`: UUID primary key.
- `owner_id`: references `profiles.id`.
- `name`
- `description`
- `status`: `draft`, `active`, `paused`, or `error`.
- `nodes`: JSON array of workflow nodes.
- `edges`: JSON array of workflow edges.
- `webhook_token`: unique random token for Webhook Trigger workflows.
- `webhook_path`: public relative path for the webhook endpoint.
- `schedule_config`: JSON object copied from the Schedule Trigger node.
- `last_run_at`: timestamp of the last scheduler attempt.
- `next_run_at`: timestamp used by the scheduler endpoint to find due workflows.
- `created_at`
- `updated_at`

### `workflow_runs`

Stores workflow execution history.

- `id`: UUID primary key.
- `workflow_id`: references `workflows.id`.
- `status`: `queued`, `running`, `success`, or `failed`.
- `input`: JSON object.
- `output`: JSON object or null.
- `error_message`
- `started_at`
- `finished_at`
- `created_at`

### `credentials`

Stores credential metadata. For the MVP, real provider secrets should come from environment variables.

- `id`: UUID primary key.
- `owner_id`: references `profiles.id`.
- `provider`
- `label`
- `encrypted_secret`: reserved for a future encryption utility.
- `secret_reference`: non-secret reference such as `RESEND_API_KEY`.
- `secret_storage_strategy`: `environment_variable` or `encrypted_secret`.
- `created_at`
- `updated_at`

Do not store plaintext secrets in this table.

### `integration_connections`

Stores per-user integration connection metadata.

- `id`: UUID primary key.
- `owner_id`: references `profiles.id`.
- `credential_id`: optional reference to `credentials.id`.
- `provider`
- `status`: `not_configured`, `connected`, `needs_attention`, or `disabled`.
- `display_name`
- `metadata`
- `created_at`
- `updated_at`

### `audit_logs`

Stores user-scoped audit events.

- `id`: UUID primary key.
- `owner_id`
- `action`
- `entity_type`
- `entity_id`
- `metadata`
- `created_at`

## Security Model

Every user-owned table has Row Level Security enabled.

Owner checks use:

```sql
auth.jwt() ->> 'sub'
```

That value must match `profiles.id` and each table's `owner_id`. This supports a Clerk/Supabase JWT integration where the JWT subject is the user id.

`workflow_runs` access is derived through the parent workflow owner.

Webhook tokens are generated server-side and stored on the workflow record. The browser may display the webhook URL for copying, but clients must not choose or overwrite `webhook_token`. Inactive workflows are rejected by the webhook endpoint.

Schedule metadata is derived server-side from Schedule Trigger nodes. The app does not run a background worker. Instead, `/api/scheduler` checks active workflows with `next_run_at <= now()` when called by Vercel Cron or an external cron service.

`credentials` policies allow users to manage only their own credential metadata. Application code should return `SafeCredential` values and must not return `encrypted_secret`.

## Migration

Apply the schema migration in Supabase SQL Editor or Supabase CLI:

```bash
supabase db push
```

If the Supabase CLI is unavailable, paste the SQL from:

```text
supabase/migrations/20260610000100_create_workflow_schema.sql
supabase/migrations/20260611000100_add_workflow_webhook_tokens.sql
supabase/migrations/20260611000200_add_workflow_schedule_fields.sql
```

into the Supabase SQL Editor.

## Seed Data

Demo data is in:

```text
supabase/seed.sql
```

It creates:

- Sales Meeting Reminder
- Travel Booking Reminder
- Lead Follow-Up
- demo workflow runs
- demo integration connection metadata

The seed data is clearly labeled as demo/mock data and does not include real provider secrets.

## TypeScript Helpers

Database types live in:

```text
src/types/database.ts
src/types/workflow.ts
```

Server helper functions live in:

```text
src/lib/db/workflows.ts
```

Use server helpers for privileged operations and keep owner ids explicit.

## Credential Encryption TODO

The current MVP does not include a production encryption utility. Until encryption is implemented:

- Store only metadata and non-secret environment variable references.
- Keep real provider keys in Vercel Environment Variables.
- Do not save plaintext API keys in `credentials`.

Before allowing user-entered secrets, add envelope encryption with managed keys, rotate keys safely, and audit all read paths so secret values are never returned to the browser.
