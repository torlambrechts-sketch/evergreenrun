-- Security hardening flagged by the Supabase linter (0011 + 0028/0029).

-- 1) Pin search_path on set_updated_at (prevents search_path hijacking).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2) handle_new_user is SECURITY DEFINER and only ever runs from the auth.users
--    trigger. Make it uncallable via the exposed PostgREST RPC surface.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
