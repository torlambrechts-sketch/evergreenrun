-- RLS proof for the public calculator_lead table.
-- anon may INSERT a well-formed lead but may NOT read any leads back, and a
-- malformed email is rejected by the WITH CHECK policy. Runs with no secrets.
--
-- Run:  psql "$DATABASE_URL" -f supabase/tests/calculator_lead_rls.sql

do $$
declare
  visible int;
  bad_blocked boolean := false;
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', json_build_object('role','anon')::text, true);

  -- Valid public insert succeeds.
  insert into public.calculator_lead (email, score) values ('lead@example.com', 62);

  -- Malformed email rejected by the policy WITH CHECK.
  begin
    insert into public.calculator_lead (email, score) values ('not-an-email', 50);
  exception when others then
    bad_blocked := true;
  end;

  -- anon must not read any leads back (no SELECT policy).
  select count(*) into visible from public.calculator_lead;

  reset role;
  delete from public.calculator_lead where email = 'lead@example.com';

  if not bad_blocked then raise exception 'FAIL: malformed email accepted'; end if;
  if visible <> 0 then raise exception 'FAIL: anon read % lead rows (expected 0)', visible; end if;

  raise notice 'CALCULATOR_LEAD RLS OK: anon insert works, read blocked, bad email rejected.';
end $$;
