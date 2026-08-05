create table if not exists wayfinder_context_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  source_device_id text not null,
  kind text not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  client_event_id text,
  payload jsonb not null default '{}'::jsonb,
  confidence numeric(4,3) not null check (confidence >= 0 and confidence <= 1),
  consent_ref text not null,
  retention_class text not null,
  evidence_refs jsonb not null default '[]'::jsonb,
  trace_id text not null
);

create unique index if not exists idx_wayfinder_context_events_client_event_id
  on wayfinder_context_events (client_event_id)
  where client_event_id is not null;

create index if not exists idx_wayfinder_context_events_user_occurred
  on wayfinder_context_events (user_id, occurred_at desc);

create table if not exists wayfinder_situations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  event_ids jsonb not null default '[]'::jsonb,
  status text not null,
  summary text not null,
  uncertainty jsonb not null default '[]'::jsonb,
  linked_goal_ids jsonb not null default '[]'::jsonb,
  linked_task_ids jsonb not null default '[]'::jsonb,
  risk_level text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  trace_id text not null
);

create index if not exists idx_wayfinder_situations_user_updated
  on wayfinder_situations (user_id, updated_at desc);

create table if not exists wayfinder_options (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  situation_id uuid not null references wayfinder_situations(id) on delete cascade,
  status text not null,
  action text not null,
  first_step text not null,
  rationale text not null,
  immediate_benefits jsonb not null default '[]'::jsonb,
  costs jsonb not null default '[]'::jsonb,
  projected_consequences jsonb not null default '[]'::jsonb,
  reversibility text not null,
  value_alignment jsonb not null default '[]'::jsonb,
  evidence_refs jsonb not null default '[]'::jsonb,
  consulted_skills jsonb not null default '[]'::jsonb,
  risk_level text not null,
  requires_approval boolean not null default false,
  created_at timestamptz not null default now(),
  trace_id text not null
);

create index if not exists idx_wayfinder_options_situation
  on wayfinder_options (situation_id, created_at);

create table if not exists wayfinder_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  situation_id uuid not null references wayfinder_situations(id) on delete cascade,
  selected_option_id uuid references wayfinder_options(id) on delete set null,
  user_override text,
  selected_at timestamptz not null default now(),
  action_status text not null,
  follow_up_at timestamptz,
  trace_id text not null
);

create index if not exists idx_wayfinder_decisions_user_selected
  on wayfinder_decisions (user_id, selected_at desc);

create table if not exists wayfinder_outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  decision_id uuid not null references wayfinder_decisions(id) on delete cascade,
  observed_at timestamptz not null default now(),
  status text not null,
  summary text not null,
  user_feeling text,
  user_rating integer check (user_rating between 1 and 5),
  prediction_error text,
  evidence_refs jsonb not null default '[]'::jsonb,
  trace_id text not null
);

create table if not exists wayfinder_value_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  value_key text not null,
  label text not null,
  description text not null default '',
  weight numeric(4,3) not null check (weight >= 0 and weight <= 1),
  priority integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  trace_id text not null
);

create table if not exists wayfinder_consent_grants (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  source text not null,
  purpose text not null,
  scope text not null,
  status text not null,
  raw_retention_seconds integer not null default 0,
  derived_retention_days integer not null default 30,
  model_sharing text not null default 'local_only',
  granted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  trace_id text not null,
  unique (user_id, source, purpose, scope)
);

create table if not exists wayfinder_intervention_budgets (
  user_id text not null,
  budget_date date not null,
  limit_count integer not null default 3 check (limit_count >= 0),
  used_count integer not null default 0 check (used_count >= 0),
  quiet_hours_start text not null default '22:00',
  quiet_hours_end text not null default '07:00',
  dismissed_until_by_kind jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, budget_date)
);

create table if not exists wayfinder_audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  reason text not null,
  occurred_at timestamptz not null default now(),
  trace_id text not null
);

create index if not exists idx_wayfinder_audit_user_occurred
  on wayfinder_audit_events (user_id, occurred_at desc);
