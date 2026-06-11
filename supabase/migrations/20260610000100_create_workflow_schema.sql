create extension if not exists "pgcrypto";

create type public.workflow_status as enum ('draft', 'active', 'paused', 'error');
create type public.workflow_run_status as enum ('queued', 'running', 'success', 'failed');
create type public.integration_connection_status as enum ('not_configured', 'connected', 'needs_attention', 'disabled');
create type public.audit_log_action as enum (
  'profile.created',
  'workflow.created',
  'workflow.updated',
  'workflow.deleted',
  'workflow.executed',
  'credential.created',
  'credential.updated',
  'integration.connected',
  'integration.updated'
);

create table public.profiles (
  id text primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  status public.workflow_status not null default 'draft',
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workflows_name_not_blank check (length(trim(name)) > 0),
  constraint workflows_nodes_array check (jsonb_typeof(nodes) = 'array'),
  constraint workflows_edges_array check (jsonb_typeof(edges) = 'array')
);

create table public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  status public.workflow_run_status not null default 'queued',
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  constraint workflow_runs_input_object check (jsonb_typeof(input) = 'object'),
  constraint workflow_runs_output_object check (output is null or jsonb_typeof(output) = 'object'),
  constraint workflow_runs_finished_after_started check (finished_at is null or finished_at >= started_at)
);

create table public.credentials (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references public.profiles(id) on delete cascade,
  provider text not null,
  label text not null,
  encrypted_secret text,
  secret_reference text,
  secret_storage_strategy text not null default 'environment_variable',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credentials_provider_not_blank check (length(trim(provider)) > 0),
  constraint credentials_label_not_blank check (length(trim(label)) > 0),
  constraint credentials_no_plaintext_strategy check (secret_storage_strategy in ('environment_variable', 'encrypted_secret'))
);

create table public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references public.profiles(id) on delete cascade,
  credential_id uuid references public.credentials(id) on delete set null,
  provider text not null,
  status public.integration_connection_status not null default 'not_configured',
  display_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integration_provider_not_blank check (length(trim(provider)) > 0),
  constraint integration_display_name_not_blank check (length(trim(display_name)) > 0),
  constraint integration_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id text references public.profiles(id) on delete set null,
  action public.audit_log_action not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_entity_type_not_blank check (length(trim(entity_type)) > 0),
  constraint audit_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index workflows_owner_id_idx on public.workflows(owner_id);
create index workflows_status_idx on public.workflows(status);
create index workflow_runs_workflow_id_idx on public.workflow_runs(workflow_id);
create index workflow_runs_status_idx on public.workflow_runs(status);
create index workflow_runs_started_at_idx on public.workflow_runs(started_at desc);
create index credentials_owner_id_provider_idx on public.credentials(owner_id, provider);
create index integration_connections_owner_id_provider_idx on public.integration_connections(owner_id, provider);
create index audit_logs_owner_id_created_at_idx on public.audit_logs(owner_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_workflows_updated_at
before update on public.workflows
for each row execute function public.set_updated_at();

create trigger set_credentials_updated_at
before update on public.credentials
for each row execute function public.set_updated_at();

create trigger set_integration_connections_updated_at
before update on public.integration_connections
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.workflows enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.credentials enable row level security;
alter table public.integration_connections enable row level security;
alter table public.audit_logs enable row level security;

create policy "Users can read their profile"
on public.profiles for select
using (id = auth.jwt() ->> 'sub');

create policy "Users can insert their profile"
on public.profiles for insert
with check (id = auth.jwt() ->> 'sub');

create policy "Users can update their profile"
on public.profiles for update
using (id = auth.jwt() ->> 'sub')
with check (id = auth.jwt() ->> 'sub');

create policy "Users can read their workflows"
on public.workflows for select
using (owner_id = auth.jwt() ->> 'sub');

create policy "Users can insert their workflows"
on public.workflows for insert
with check (owner_id = auth.jwt() ->> 'sub');

create policy "Users can update their workflows"
on public.workflows for update
using (owner_id = auth.jwt() ->> 'sub')
with check (owner_id = auth.jwt() ->> 'sub');

create policy "Users can delete their workflows"
on public.workflows for delete
using (owner_id = auth.jwt() ->> 'sub');

create policy "Users can read runs for their workflows"
on public.workflow_runs for select
using (
  exists (
    select 1 from public.workflows
    where workflows.id = workflow_runs.workflow_id
      and workflows.owner_id = auth.jwt() ->> 'sub'
  )
);

create policy "Users can insert runs for their workflows"
on public.workflow_runs for insert
with check (
  exists (
    select 1 from public.workflows
    where workflows.id = workflow_runs.workflow_id
      and workflows.owner_id = auth.jwt() ->> 'sub'
  )
);

create policy "Users can update runs for their workflows"
on public.workflow_runs for update
using (
  exists (
    select 1 from public.workflows
    where workflows.id = workflow_runs.workflow_id
      and workflows.owner_id = auth.jwt() ->> 'sub'
  )
)
with check (
  exists (
    select 1 from public.workflows
    where workflows.id = workflow_runs.workflow_id
      and workflows.owner_id = auth.jwt() ->> 'sub'
  )
);

create policy "Users can read credential metadata"
on public.credentials for select
using (owner_id = auth.jwt() ->> 'sub');

create policy "Users can insert credential metadata"
on public.credentials for insert
with check (owner_id = auth.jwt() ->> 'sub');

create policy "Users can update credential metadata"
on public.credentials for update
using (owner_id = auth.jwt() ->> 'sub')
with check (owner_id = auth.jwt() ->> 'sub');

create policy "Users can delete credential metadata"
on public.credentials for delete
using (owner_id = auth.jwt() ->> 'sub');

create policy "Users can read their integration connections"
on public.integration_connections for select
using (owner_id = auth.jwt() ->> 'sub');

create policy "Users can insert their integration connections"
on public.integration_connections for insert
with check (owner_id = auth.jwt() ->> 'sub');

create policy "Users can update their integration connections"
on public.integration_connections for update
using (owner_id = auth.jwt() ->> 'sub')
with check (owner_id = auth.jwt() ->> 'sub');

create policy "Users can delete their integration connections"
on public.integration_connections for delete
using (owner_id = auth.jwt() ->> 'sub');

create policy "Users can read their audit logs"
on public.audit_logs for select
using (owner_id = auth.jwt() ->> 'sub');

create policy "Users can insert their audit logs"
on public.audit_logs for insert
with check (owner_id = auth.jwt() ->> 'sub');
