create table if not exists health_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  device_id text,
  source_platform text not null,
  source_provider text not null,
  source_device text,
  window_start timestamptz not null,
  window_end timestamptz not null,
  captured_at timestamptz,
  received_at timestamptz,
  missingness text not null default 'available',
  consent_scope text not null default 'health_summary',
  consent_ref text,
  retention_class text not null default 'summary',
  confidence numeric(4,3) not null default 0.5 check (confidence >= 0 and confidence <= 1),
  evidence_refs jsonb not null default '[]'::jsonb,
  heart_rate numeric,
  oxygen_saturation numeric,
  resting_heart_rate numeric,
  sleep_minutes integer,
  active_minutes integer,
  steps integer,
  summary text,
  created_at timestamptz not null default now()
);

alter table health_snapshots add column if not exists consent_ref text;
alter table health_snapshots add column if not exists active_minutes integer;
alter table health_snapshots add column if not exists steps integer;

create index if not exists idx_health_snapshots_user_created
  on health_snapshots (user_id, created_at desc);

create table if not exists wayfinder_health_calibration_records (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  window_start timestamptz not null,
  window_end timestamptz not null,
  recommendation text not null,
  predicted_energy_band text not null,
  actual_energy_band text not null,
  outcome text not null,
  user_rating integer check (user_rating between 1 and 5),
  absolute_error numeric(5,4) not null check (absolute_error >= 0 and absolute_error <= 1),
  evidence_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_health_calibration_user_created
  on wayfinder_health_calibration_records (user_id, created_at desc);
