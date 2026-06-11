alter table public.workflows
  add column if not exists webhook_token text unique,
  add column if not exists webhook_path text;

create index if not exists workflows_webhook_token_idx
  on public.workflows(webhook_token)
  where webhook_token is not null;
