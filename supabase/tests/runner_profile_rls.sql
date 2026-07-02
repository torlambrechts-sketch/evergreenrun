-- DB-level RLS negative-access proof for runner_profile.
-- Runs entirely in Postgres — no app, no network, no service key needed.
--
-- Run against the project with either:
--   supabase db execute --file supabase/tests/runner_profile_rls.sql
--   psql "$DATABASE_URL" -f supabase/tests/runner_profile_rls.sql
--
-- It RAISES EXCEPTION (non-zero) if isolation is broken, and RAISES NOTICE on pass.
-- This is the canonical Session-1 negative test: user B cannot read user A's row.

do $$
declare
  user_a uuid := '11111111-1111-1111-1111-111111111111';
  user_b uuid := '22222222-2222-2222-2222-222222222222';
  visible_count int;
  own_count int;
begin
  -- Seed two real auth users; the on_auth_user_created trigger auto-creates
  -- their public.users + runner_profile rows.
  insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
  values
    (user_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls_a@test.local', now(), now()),
    (user_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls_b@test.local', now(), now())
  on conflict (id) do nothing;

  -- Impersonate User B: the 'authenticated' role carrying B's JWT sub claim,
  -- exactly as PostgREST does for a signed-in request.
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
                     json_build_object('sub', user_b, 'role', 'authenticated')::text, true);

  select count(*) into visible_count from public.runner_profile where user_id = user_a;
  select count(*) into own_count     from public.runner_profile where user_id = user_b;

  -- Back to owner to clean up regardless of outcome.
  reset role;
  delete from auth.users where id in (user_a, user_b); -- cascades to public.users -> runner_profile

  if visible_count <> 0 then
    raise exception 'RLS FAIL: user B could read % of user A''s runner_profile rows (expected 0)', visible_count;
  end if;
  if own_count <> 1 then
    raise exception 'RLS FAIL: user B saw % of its own runner_profile rows (expected 1)', own_count;
  end if;

  raise notice 'RLS PASS: user B read 0 of user A''s rows and 1 of its own.';
end $$;
