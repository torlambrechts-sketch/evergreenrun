-- DB-level RLS negative-access proof for the full canonical schema (Session 2).
-- For every user-scoped table: user B reads 0 of user A's rows and >=1 of its own.
-- For shared reference tables (rule_set, exercise): a signed-in user can read but
-- CANNOT write. Raises EXCEPTION on any violation; NOTICE on pass.
--
-- Run:  psql "$DATABASE_URL" -f supabase/tests/canonical_schema_rls.sql
--   or  supabase db execute --file supabase/tests/canonical_schema_rls.sql

do $$
declare
  user_a uuid := '11111111-1111-1111-1111-111111111111';
  user_b uuid := '22222222-2222-2222-2222-222222222222';
  plan_a uuid;
  plan_b uuid;
  owner_tables text[] := array[
    'consent_record','safety_profile','run_activity','strength_session',
    'feel_log','weekly_load','plan','planned_session',
    'red_flag_event','durability_index_snapshot'
  ];
  t text;
  saw_a int;
  saw_own int;
  ref_read int;
  write_blocked boolean;
begin
  -- ---- Seed two real auth users (trigger creates users + runner_profile) ----
  insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
  values
    (user_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 's2_a@test.local', now(), now()),
    (user_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 's2_b@test.local', now(), now())
  on conflict (id) do nothing;

  -- ---- Seed one row per user-scoped table for BOTH users (as superuser) ----
  insert into public.consent_record (user_id, consent_type, granted) values (user_a,'terms',true),(user_b,'terms',true);
  insert into public.safety_profile (user_id) values (user_a),(user_b);
  insert into public.run_activity (user_id, distance_m, duration_s) values (user_a,5000,1800),(user_b,5000,1800);
  insert into public.strength_session (user_id, session_type) values (user_a,'A'),(user_b,'A');
  insert into public.feel_log (user_id, soreness, pain_intensity, morning_stiffness, confidence) values
    (user_a,2,1,1,7),(user_b,2,1,1,7);
  insert into public.weekly_load (user_id, week_start) values (user_a, date '2026-06-29'),(user_b, date '2026-06-29');
  insert into public.plan (user_id, week_start, rule_set_version) values
    (user_a, date '2026-06-29','test') returning id into plan_a;
  insert into public.plan (user_id, week_start, rule_set_version) values
    (user_b, date '2026-06-29','test') returning id into plan_b;
  insert into public.planned_session (plan_id, user_id, session_type) values
    (plan_a, user_a,'easy'),(plan_b, user_b,'easy');
  insert into public.red_flag_event (user_id, severity) values (user_a,'monitor'),(user_b,'monitor');
  insert into public.durability_index_snapshot (user_id, rule_set_version, score) values
    (user_a,'test',60),(user_b,'test',60);

  -- ---- Seed shared reference data once ----
  insert into public.rule_set (name, version) values ('durability_index','test')
    on conflict (name, version) do nothing;
  insert into public.exercise (slug, name) values ('hsr-calf-raise','HSR Calf Raise')
    on conflict (slug) do nothing;

  -- ---- Impersonate User B ----
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
                     json_build_object('sub', user_b, 'role', 'authenticated')::text, true);

  -- Owner-scoped tables: B sees 0 of A, >=1 of its own.
  foreach t in array owner_tables loop
    execute format('select count(*) from public.%I where user_id = $1', t) into saw_a  using user_a;
    execute format('select count(*) from public.%I where user_id = $1', t) into saw_own using user_b;
    if saw_a <> 0 then
      reset role;
      raise exception 'RLS FAIL on %: user B read % of user A rows (expected 0)', t, saw_a;
    end if;
    if saw_own < 1 then
      reset role;
      raise exception 'RLS FAIL on %: user B saw % of its own rows (expected >=1)', t, saw_own;
    end if;
  end loop;

  -- Reference tables: B can read...
  execute 'select count(*) from public.rule_set' into ref_read;
  if ref_read < 1 then reset role; raise exception 'RLS FAIL: B cannot read rule_set'; end if;
  execute 'select count(*) from public.exercise' into ref_read;
  if ref_read < 1 then reset role; raise exception 'RLS FAIL: B cannot read exercise'; end if;

  -- ...but B CANNOT write to a reference table (RLS has no write policy).
  write_blocked := false;
  begin
    execute 'insert into public.rule_set (name, version) values (''hack'', ''x'')';
  exception when insufficient_privilege or others then
    write_blocked := true;
  end;
  if not write_blocked then
    reset role;
    raise exception 'RLS FAIL: user B was able to write to rule_set';
  end if;

  -- ---- Cleanup ----
  reset role;
  delete from public.rule_set where name in ('durability_index','hack') and version in ('test','x');
  delete from public.exercise where slug = 'hsr-calf-raise';
  delete from auth.users where id in (user_a, user_b); -- cascades to all user-scoped rows

  raise notice 'RLS PASS: all % owner-scoped tables isolated; reference tables read-only.', array_length(owner_tables,1);
end $$;
