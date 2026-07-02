# Tests

## RLS negative-access tests (Golden rule 3)

Every table must prove a user cannot read another user's rows. Session 1 covers
`runner_profile` two ways:

### 1. DB-level proof (always runnable, no secrets)
`supabase/tests/runner_profile_rls.sql` simulates two signed-in users in Postgres
and raises an exception if isolation breaks.

```bash
supabase db execute --file supabase/tests/runner_profile_rls.sql
# or
psql "$DATABASE_URL" -f supabase/tests/runner_profile_rls.sql
```

### 2. App-level integration test (CI, needs service key)
`tests/rls/runner_profile.rls.test.ts` seeds two real auth users with the
`service_role` key, then reads through anon clients scoped to each user's own
session — exactly like the app.

```bash
# .env.local must contain SUPABASE_SERVICE_ROLE_KEY (Dashboard → Settings → API)
npm test
```

Without `SUPABASE_SERVICE_ROLE_KEY` the suite **skips loudly** (it never passes
vacuously). Use the DB-level proof above when the service key isn't available.
