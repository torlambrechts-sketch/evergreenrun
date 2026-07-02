-- Evergreen Run — Session 1 schema
-- users (mirror of auth.users) + runner_profile, both with owner-only RLS.
-- Golden rule 3: RLS on every table; a user can only ever read/write their own rows.

-- ============================================================
-- public.users : minimal profile mirror of auth.users
-- ============================================================
create table if not exists public.users (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

comment on table public.users is 'Profile mirror of auth.users. One row per authenticated user.';

alter table public.users enable row level security;
-- Belt-and-braces: never allow RLS to be bypassed for non-owners.
alter table public.users force row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
  on public.users for select
  using ( (select auth.uid()) = id );

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
  on public.users for update
  using ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

-- No INSERT/DELETE policy for end users: rows are created by the signup trigger
-- (security definer) and removed via auth.users cascade only.

-- ============================================================
-- public.runner_profile : per-user running profile
-- ============================================================
create table if not exists public.runner_profile (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique references public.users (id) on delete cascade,
  display_name     text,
  age_band         text,
  experience_level text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.runner_profile is 'Per-user running profile. Exactly one per user (user_id unique).';

create index if not exists runner_profile_user_id_idx on public.runner_profile (user_id);

alter table public.runner_profile enable row level security;
alter table public.runner_profile force row level security;

drop policy if exists "runner_profile_select_own" on public.runner_profile;
create policy "runner_profile_select_own"
  on public.runner_profile for select
  using ( (select auth.uid()) = user_id );

drop policy if exists "runner_profile_insert_own" on public.runner_profile;
create policy "runner_profile_insert_own"
  on public.runner_profile for insert
  with check ( (select auth.uid()) = user_id );

drop policy if exists "runner_profile_update_own" on public.runner_profile;
create policy "runner_profile_update_own"
  on public.runner_profile for update
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

drop policy if exists "runner_profile_delete_own" on public.runner_profile;
create policy "runner_profile_delete_own"
  on public.runner_profile for delete
  using ( (select auth.uid()) = user_id );

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists runner_profile_set_updated_at on public.runner_profile;
create trigger runner_profile_set_updated_at
  before update on public.runner_profile
  for each row execute function public.set_updated_at();

-- ============================================================
-- Signup trigger: create public.users (+ empty runner_profile) on auth signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  insert into public.runner_profile (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
