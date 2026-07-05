create table if not exists mobile_capture_devices (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  device_id text not null unique,
  device_name text not null,
  platform text not null default 'android',
  app_version text,
  platform_version text,
  pairing_state text not null default 'paired',
  desktop_host text not null,
  consent_acknowledged_at timestamptz,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audio_capture_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  device_id text not null references mobile_capture_devices(device_id) on delete cascade,
  capture_mode text not null,
  status text not null,
  sample_rate_hz integer not null,
  channels integer not null,
  encoding text not null,
  chunk_duration_ms integer not null,
  rolling_buffer_seconds integer not null,
  received_chunk_count integer not null default 0,
  last_chunk_at timestamptz,
  started_at timestamptz not null,
  ended_at timestamptz
);

create table if not exists call_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  device_id text not null references mobile_capture_devices(device_id) on delete cascade,
  direction text not null,
  status text not null,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists emotion_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  device_id text references mobile_capture_devices(device_id) on delete set null,
  session_id uuid references audio_capture_sessions(id) on delete set null,
  chunk_sequence integer,
  window_start timestamptz not null,
  window_end timestamptz not null,
  emotion_label text not null,
  valence_score integer not null,
  arousal_score integer not null,
  stress_score integer not null,
  confidence numeric not null,
  summary text not null,
  model_name text,
  source text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_mobile_capture_devices_user_id on mobile_capture_devices (user_id, updated_at desc);
create index if not exists idx_audio_capture_sessions_user_id on audio_capture_sessions (user_id, started_at desc);
create index if not exists idx_call_events_user_id on call_events (user_id, occurred_at desc);
create index if not exists idx_emotion_assessments_user_id on emotion_assessments (user_id, created_at desc);
