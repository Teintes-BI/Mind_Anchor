create extension if not exists "pgcrypto";

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  description text not null default '',
  status text not null default 'active',
  target_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  goal_id uuid not null references goals(id) on delete cascade,
  title text not null,
  status text not null default 'todo',
  priority text not null default 'medium',
  estimated_minutes integer not null default 25,
  due_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  task_id uuid references tasks(id) on delete set null,
  goal_id uuid references goals(id) on delete set null,
  status text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  interruption_count integer not null default 0,
  summary text not null default ''
);

create table if not exists state_signal_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  source text not null,
  event_type text not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  client_event_id text,
  payload jsonb not null default '{}'::jsonb
);

create unique index if not exists idx_state_signal_events_client_event_id
  on state_signal_events (client_event_id)
  where client_event_id is not null;

create table if not exists state_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  window_start timestamptz not null,
  window_end timestamptz not null,
  focus_score integer not null,
  energy_score integer not null,
  mood_score integer not null,
  summary text not null,
  recommended_action text not null,
  source text not null,
  created_at timestamptz not null default now()
);

create table if not exists interventions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  assessment_id uuid references state_assessments(id) on delete set null,
  trigger text not null,
  action text not null,
  copy text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists recovery_plans (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  session_id uuid references focus_sessions(id) on delete set null,
  task_id uuid references tasks(id) on delete set null,
  reason text not null,
  next_step text not null,
  suggested_minutes integer not null,
  reprioritized_task_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists reflection_reports (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  period_type text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  highlights jsonb not null default '[]'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  trends jsonb not null default '[]'::jsonb,
  next_suggestions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_tasks_goal_id on tasks (goal_id);
create index if not exists idx_focus_sessions_user_id on focus_sessions (user_id, started_at desc);
create index if not exists idx_state_assessments_user_id on state_assessments (user_id, created_at desc);
create index if not exists idx_reflection_reports_user_id on reflection_reports (user_id, created_at desc);
