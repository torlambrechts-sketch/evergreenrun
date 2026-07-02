-- Evergreen Run — Session 2: the full canonical schema.
-- Every table ships with RLS. User-scoped tables are owner-only
-- ((select auth.uid()) = user_id). Shared reference tables (rule_set, exercise)
-- are read-only to signed-in users with all writes denied. Audit/snapshot tables
-- (red_flag_event, durability_index_snapshot) are insert+select-own and immutable
-- (no update/delete policy => those operations are denied).
--
-- runner_profile + public.users already exist (migration 20260702090001).
-- Golden rule 2: no engine numbers are baked in here — only data-domain checks
-- (0..10 rating scales, RPE 1..10) which are scale definitions, not rules.

-- ============================================================
-- consent_record : append-only consent history (owner-only)
-- ============================================================
create table if not exists public.consent_record (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  consent_type text not null,
  granted      boolean not null,
  policy_version text,
  granted_at   timestamptz not null default now(),
  created_at   timestamptz not null default now()
);
comment on table public.consent_record is 'Append-only consent history. One row per grant/revoke.';
create index if not exists consent_record_user_id_idx on public.consent_record (user_id);

-- ============================================================
-- safety_profile : one per user (owner-only)
-- ============================================================
create table if not exists public.safety_profile (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null unique references public.users (id) on delete cascade,
  contraindications  text[] not null default '{}',
  injury_history     jsonb  not null default '[]'::jsonb,
  red_flag_baseline  jsonb  not null default '{}'::jsonb,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
comment on table public.safety_profile is 'Per-user clinical safety baseline. Exactly one per user.';

-- ============================================================
-- run_activity : logged runs, with source_hash dedup (owner-only)
-- ============================================================
create table if not exists public.run_activity (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users (id) on delete cascade,
  source             text not null default 'manual' check (source in ('manual','fit','gpx')),
  source_hash        text,
  started_at         timestamptz,
  distance_m         numeric(10,2) check (distance_m >= 0),
  duration_s         integer check (duration_s >= 0),
  avg_pace_s_per_km  numeric(8,2) check (avg_pace_s_per_km >= 0),
  avg_hr             integer check (avg_hr between 0 and 300),
  rpe                smallint check (rpe between 1 and 10),
  talk_test          text check (talk_test in ('full_sentences','phrases','single_words')),
  raw_payload        jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
comment on table public.run_activity is 'Logged runs (manual or file upload). Deduped per user via source_hash.';
comment on column public.run_activity.raw_payload is 'Retained raw FIT/GPX payload for future reprocessing (Session 6).';
create index if not exists run_activity_user_id_started_idx on public.run_activity (user_id, started_at desc);
-- Dedup: a given source_hash can appear at most once per user.
create unique index if not exists run_activity_user_source_hash_uidx
  on public.run_activity (user_id, source_hash) where source_hash is not null;

-- ============================================================
-- strength_session : logged strength work (owner-only)
-- ============================================================
create table if not exists public.strength_session (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  performed_at timestamptz not null default now(),
  session_type text check (session_type in ('A','B')),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.strength_session is 'Logged strength sessions (A/B). Feeds the Strength sub-score.';
create index if not exists strength_session_user_id_idx on public.strength_session (user_id, performed_at desc);

-- ============================================================
-- feel_log : subjective check-ins (owner-only)
-- ============================================================
create table if not exists public.feel_log (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users (id) on delete cascade,
  logged_at         timestamptz not null default now(),
  soreness          smallint check (soreness between 0 and 10),
  pain_area         text,
  pain_intensity    smallint check (pain_intensity between 0 and 10),
  morning_stiffness smallint check (morning_stiffness between 0 and 10),
  fatigue           smallint check (fatigue between 0 and 10),
  confidence        smallint check (confidence between 0 and 10),
  notes             text,
  created_at        timestamptz not null default now()
);
comment on table public.feel_log is 'Subjective check-in: soreness, pain, morning stiffness, fatigue, weekly confidence.';
create index if not exists feel_log_user_id_idx on public.feel_log (user_id, logged_at desc);

-- ============================================================
-- weekly_load : rolled-up weekly training load (owner-only)
-- ============================================================
create table if not exists public.weekly_load (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users (id) on delete cascade,
  week_start        date not null,
  total_distance_m  numeric(12,2) not null default 0,
  total_duration_s  integer not null default 0,
  acute_load        numeric(12,2),
  chronic_load      numeric(12,2),
  hard_days         smallint not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, week_start)
);
comment on table public.weekly_load is 'One row per user per ISO week (week_start = Monday).';

-- ============================================================
-- rule_set : advisor-owned versioned rule config (shared, read-only)
-- ============================================================
create table if not exists public.rule_set (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  version      text not null,
  config       jsonb not null default '{}'::jsonb,
  is_active    boolean not null default false,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (name, version)
);
comment on table public.rule_set is 'Advisor-owned versioned rule config. Shared reference data; users read only.';

-- ============================================================
-- exercise : shared exercise library (shared, read-only)
-- ============================================================
create table if not exists public.exercise (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique,
  name                  text not null,
  category              text,
  block                 text check (block in ('competence','load')),
  tempo                 text,
  contraindication_flags text[] not null default '{}',
  regression_of         uuid references public.exercise (id),
  progression_of        uuid references public.exercise (id),
  instructions          text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
comment on table public.exercise is 'Exercise library. Contraindication flags + regression links let the engine substitute, not skip.';

-- ============================================================
-- red_flag_event : safety audit trail (owner-only, immutable)
-- ============================================================
create table if not exists public.red_flag_event (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users (id) on delete cascade,
  feel_log_id      uuid references public.feel_log (id) on delete set null,
  rule_set_version text,
  severity         text not null check (severity in ('monitor','downshift','clinician')),
  reason           text,
  action_taken     text,
  created_at       timestamptz not null default now()
);
comment on table public.red_flag_event is 'Immutable audit trail of red-flag ladder triggers and routed action.';
create index if not exists red_flag_event_user_id_idx on public.red_flag_event (user_id, created_at desc);

-- ============================================================
-- plan : a generated week plan (owner-only)
-- ============================================================
create table if not exists public.plan (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users (id) on delete cascade,
  week_start       date not null,
  rule_set_version text not null,
  program          text,
  status           text not null default 'active' check (status in ('active','superseded','archived')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, week_start)
);
comment on table public.plan is 'A generated week plan. Stamped with rule_set_version.';

-- ============================================================
-- planned_session : sessions within a plan (owner-only)
-- ============================================================
create table if not exists public.planned_session (
  id                uuid primary key default gen_random_uuid(),
  plan_id           uuid not null references public.plan (id) on delete cascade,
  user_id           uuid not null references public.users (id) on delete cascade,
  day_of_week       smallint check (day_of_week between 0 and 6),
  session_type      text not null check (session_type in ('easy','quality','long','strength','rest','walk_run')),
  target_distance_m numeric(10,2) check (target_distance_m >= 0),
  target_duration_s integer check (target_duration_s >= 0),
  target_zone       text,
  notes             text,
  completed         boolean not null default false,
  run_activity_id   uuid references public.run_activity (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
comment on table public.planned_session is 'An individual prescribed session within a plan. user_id denormalized for RLS.';
create index if not exists planned_session_plan_id_idx on public.planned_session (plan_id);
create index if not exists planned_session_user_id_idx on public.planned_session (user_id);

-- ============================================================
-- durability_index_snapshot : persisted scores (owner-only, immutable)
-- ============================================================
create table if not exists public.durability_index_snapshot (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.users (id) on delete cascade,
  rule_set_version     text not null,
  score                numeric(6,2) not null,
  load_subscore        numeric(6,2),
  strength_subscore    numeric(6,2),
  consistency_subscore numeric(6,2),
  readiness_subscore   numeric(6,2),
  breakdown            jsonb,
  computed_at          timestamptz not null default now(),
  created_at           timestamptz not null default now()
);
comment on table public.durability_index_snapshot is 'Immutable Durability Index snapshot + sub-score breakdown, stamped with rule_set_version.';
create index if not exists durability_index_snapshot_user_id_idx on public.durability_index_snapshot (user_id, computed_at desc);

-- keep updated_at fresh on tables that have it
drop trigger if exists safety_profile_set_updated_at on public.safety_profile;
create trigger safety_profile_set_updated_at before update on public.safety_profile
  for each row execute function public.set_updated_at();
drop trigger if exists run_activity_set_updated_at on public.run_activity;
create trigger run_activity_set_updated_at before update on public.run_activity
  for each row execute function public.set_updated_at();
drop trigger if exists strength_session_set_updated_at on public.strength_session;
create trigger strength_session_set_updated_at before update on public.strength_session
  for each row execute function public.set_updated_at();
drop trigger if exists weekly_load_set_updated_at on public.weekly_load;
create trigger weekly_load_set_updated_at before update on public.weekly_load
  for each row execute function public.set_updated_at();
drop trigger if exists exercise_set_updated_at on public.exercise;
create trigger exercise_set_updated_at before update on public.exercise
  for each row execute function public.set_updated_at();
drop trigger if exists plan_set_updated_at on public.plan;
create trigger plan_set_updated_at before update on public.plan
  for each row execute function public.set_updated_at();
drop trigger if exists planned_session_set_updated_at on public.planned_session;
create trigger planned_session_set_updated_at before update on public.planned_session
  for each row execute function public.set_updated_at();

-- ============================================================
-- RLS: enable + force on every table
-- ============================================================
alter table public.consent_record            enable row level security;
alter table public.consent_record            force row level security;
alter table public.safety_profile            enable row level security;
alter table public.safety_profile            force row level security;
alter table public.run_activity              enable row level security;
alter table public.run_activity              force row level security;
alter table public.strength_session          enable row level security;
alter table public.strength_session          force row level security;
alter table public.feel_log                  enable row level security;
alter table public.feel_log                  force row level security;
alter table public.weekly_load               enable row level security;
alter table public.weekly_load               force row level security;
alter table public.rule_set                  enable row level security;
alter table public.rule_set                  force row level security;
alter table public.exercise                  enable row level security;
alter table public.exercise                  force row level security;
alter table public.red_flag_event            enable row level security;
alter table public.red_flag_event            force row level security;
alter table public.plan                      enable row level security;
alter table public.plan                      force row level security;
alter table public.planned_session           enable row level security;
alter table public.planned_session           force row level security;
alter table public.durability_index_snapshot enable row level security;
alter table public.durability_index_snapshot force row level security;

-- ---- Owner-only policies (full CRUD scoped to auth.uid() = user_id) ----
do $$
declare t text;
begin
  foreach t in array array[
    'consent_record','safety_profile','run_activity','strength_session',
    'feel_log','weekly_load','plan','planned_session'
  ] loop
    execute format('drop policy if exists %I on public.%I', t||'_select_own', t);
    execute format('create policy %I on public.%I for select using ((select auth.uid()) = user_id)', t||'_select_own', t);
    execute format('drop policy if exists %I on public.%I', t||'_insert_own', t);
    execute format('create policy %I on public.%I for insert with check ((select auth.uid()) = user_id)', t||'_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t||'_update_own', t);
    execute format('create policy %I on public.%I for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t||'_update_own', t);
    execute format('drop policy if exists %I on public.%I', t||'_delete_own', t);
    execute format('create policy %I on public.%I for delete using ((select auth.uid()) = user_id)', t||'_delete_own', t);
  end loop;
end $$;

-- ---- Immutable owner tables: select + insert own, NO update/delete ----
do $$
declare t text;
begin
  foreach t in array array['red_flag_event','durability_index_snapshot'] loop
    execute format('drop policy if exists %I on public.%I', t||'_select_own', t);
    execute format('create policy %I on public.%I for select using ((select auth.uid()) = user_id)', t||'_select_own', t);
    execute format('drop policy if exists %I on public.%I', t||'_insert_own', t);
    execute format('create policy %I on public.%I for insert with check ((select auth.uid()) = user_id)', t||'_insert_own', t);
  end loop;
end $$;

-- ---- Shared reference tables: read-only to signed-in users, writes denied ----
drop policy if exists "rule_set_select_authenticated" on public.rule_set;
create policy "rule_set_select_authenticated"
  on public.rule_set for select to authenticated using (true);

drop policy if exists "exercise_select_authenticated" on public.exercise;
create policy "exercise_select_authenticated"
  on public.exercise for select to authenticated using (true);
