insert into public.profiles (id, email, full_name)
values
  ('demo_user', 'demo@rovanta.io', 'Rovanta Demo User')
on conflict (id) do update
set email = excluded.email,
    full_name = excluded.full_name;

insert into public.workflows (
  id,
  owner_id,
  name,
  description,
  status,
  nodes,
  edges,
  webhook_token,
  webhook_path,
  schedule_config,
  last_run_at,
  next_run_at
)
values
  (
    '00000000-0000-4000-8000-000000000101',
    'demo_user',
    'Sales Meeting Reminder',
    'Demo workflow that sends a reminder before a sales meeting.',
    'active',
    '[{"id":"trigger-1","type":"scheduleTrigger","label":"Daily schedule","config":{"intervalType":"daily","intervalValue":1,"timezone":"UTC"}},{"id":"email-1","type":"sendEmail","label":"Send reminder email","config":{"provider":"resend","to":"demo@example.com","subject":"Meeting reminder","body":"This is demo data. Configure Resend before sending real email."}}]'::jsonb,
    '[{"id":"edge-1","source":"trigger-1","target":"email-1"}]'::jsonb,
    null,
    null,
    '{"intervalType":"daily","intervalValue":1,"timezone":"UTC"}'::jsonb,
    now() - interval '35 minutes',
    now() + interval '1 day'
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    'demo_user',
    'Travel Booking Reminder',
    'Demo workflow for scheduled customer travel reminders.',
    'draft',
    '[{"id":"trigger-1","type":"scheduleTrigger","label":"Trip reminder schedule","config":{"intervalType":"daily","intervalValue":1,"timezone":"UTC"}},{"id":"email-1","type":"sendEmail","label":"Send customer reminder","config":{"provider":"resend","to":"demo@example.com","subject":"Upcoming trip reminder","body":"This is demo data only."}}]'::jsonb,
    '[{"id":"edge-1","source":"trigger-1","target":"email-1"}]'::jsonb,
    null,
    null,
    '{"intervalType":"daily","intervalValue":1,"timezone":"UTC"}'::jsonb,
    now() - interval '2 hours',
    null
  ),
  (
    '00000000-0000-4000-8000-000000000103',
    'demo_user',
    'Lead Follow-Up',
    'Demo workflow for webhook-triggered AI follow-up drafts.',
    'paused',
    '[{"id":"trigger-1","type":"webhookTrigger","label":"New lead webhook","config":{"method":"POST","webhookUrl":"/api/webhooks/demo-lead-follow-up-token-000000000000","demo":true}},{"id":"ai-1","type":"aiTextGenerate","label":"Draft follow-up","config":{"provider":"gemini","prompt":"Write a concise follow-up email for a new lead.","outputVariable":"followUpEmail"}},{"id":"email-1","type":"sendEmail","label":"Send follow-up","config":{"provider":"resend","to":"demo@example.com","subject":"Following up","body":"{{followUpEmail}}"}}]'::jsonb,
    '[{"id":"edge-1","source":"trigger-1","target":"ai-1"},{"id":"edge-2","source":"ai-1","target":"email-1"}]'::jsonb,
    'demo-lead-follow-up-token-000000000000',
    '/api/webhooks/demo-lead-follow-up-token-000000000000',
    null,
    now() - interval '1 day',
    null
  )
on conflict (id) do update
set name = excluded.name,
    description = excluded.description,
    status = excluded.status,
    nodes = excluded.nodes,
    edges = excluded.edges,
    webhook_token = excluded.webhook_token,
    webhook_path = excluded.webhook_path,
    schedule_config = excluded.schedule_config,
    last_run_at = excluded.last_run_at,
    next_run_at = excluded.next_run_at;

insert into public.workflow_runs (id, workflow_id, status, input, output, error_message, started_at, finished_at)
values
  (
    '00000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000101',
    'success',
    '{"demo":true,"source":"seed"}'::jsonb,
    '{"demo":true,"message":"Mock reminder generated. No real email was sent."}'::jsonb,
    null,
    now() - interval '35 minutes',
    now() - interval '34 minutes'
  ),
  (
    '00000000-0000-4000-8000-000000000202',
    '00000000-0000-4000-8000-000000000102',
    'success',
    '{"demo":true,"source":"seed"}'::jsonb,
    '{"demo":true,"message":"Mock travel reminder completed."}'::jsonb,
    null,
    now() - interval '2 hours',
    now() - interval '119 minutes'
  ),
  (
    '00000000-0000-4000-8000-000000000203',
    '00000000-0000-4000-8000-000000000103',
    'failed',
    '{"demo":true,"source":"seed"}'::jsonb,
    null,
    'Demo failure: Resend is not configured in this seed environment.',
    now() - interval '1 day',
    now() - interval '1 day' + interval '20 seconds'
  )
on conflict (id) do update
set status = excluded.status,
    input = excluded.input,
    output = excluded.output,
    error_message = excluded.error_message,
    started_at = excluded.started_at,
    finished_at = excluded.finished_at;

insert into public.integration_connections (id, owner_id, provider, status, display_name, metadata)
values
  (
    '00000000-0000-4000-8000-000000000301',
    'demo_user',
    'resend',
    'not_configured',
    'Resend demo connection',
    '{"demo":true,"note":"Configure RESEND_API_KEY and RESEND_FROM_EMAIL in Vercel before sending real email."}'::jsonb
  ),
  (
    '00000000-0000-4000-8000-000000000302',
    'demo_user',
    'gemini',
    'not_configured',
    'Gemini demo connection',
    '{"demo":true,"note":"Configure GEMINI_API_KEY in Vercel before calling Gemini."}'::jsonb
  )
on conflict (id) do update
set status = excluded.status,
    display_name = excluded.display_name,
    metadata = excluded.metadata;
