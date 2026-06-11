alter table public.workflows
  add column if not exists schedule_config jsonb,
  add column if not exists last_run_at timestamptz,
  add column if not exists next_run_at timestamptz;

alter table public.workflows
  add constraint workflows_schedule_config_object
  check (schedule_config is null or jsonb_typeof(schedule_config) = 'object');

create index if not exists workflows_next_run_at_idx
  on public.workflows(next_run_at)
  where next_run_at is not null;

create index if not exists workflows_active_schedule_due_idx
  on public.workflows(status, next_run_at)
  where next_run_at is not null;
