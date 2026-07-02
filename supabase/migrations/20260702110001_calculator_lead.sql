-- Public Gate-1 calculator lead capture.
-- Anyone (anon) may INSERT their email + resulting score. NOBODY except the
-- service role may read it back (no SELECT policy) — a public write-only inbox.
-- No health data is stored here: email + the derived score only, never the
-- quiz's pain/soreness inputs.
create table if not exists public.calculator_lead (
  id         uuid primary key default gen_random_uuid(),
  email      text not null check (char_length(email) between 3 and 320),
  score      smallint check (score between 0 and 100),
  created_at timestamptz not null default now()
);

comment on table public.calculator_lead is 'Public calculator email capture. Insert-only for anon/authenticated; readable only by service role.';

alter table public.calculator_lead enable row level security;
alter table public.calculator_lead force row level security;

-- Public may insert a well-formed lead; nothing else. A meaningful WITH CHECK
-- (email shape + present score) rather than a blanket true.
drop policy if exists "calculator_lead_insert_public" on public.calculator_lead;
create policy "calculator_lead_insert_public"
  on public.calculator_lead for insert
  to anon, authenticated
  with check (
    email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    and char_length(email) <= 320
    and score is not null
    and score between 0 and 100
  );

-- No SELECT/UPDATE/DELETE policy => those are denied for anon and authenticated.
-- The service role bypasses RLS for back-office access.
