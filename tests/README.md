# Tests

## RLS negative-access tests (Golden rule 3)

Every table must prove a user cannot read another user's rows. Session 1 covers
`runner_profile` two ways:

### 1. DB-level proof (always runnable, no secrets)
Simulates two signed-in users in Postgres and raises an exception if isolation breaks:
- `supabase/tests/runner_profile_rls.sql` — Session 1 (`runner_profile`).
- `supabase/tests/canonical_schema_rls.sql` — Session 2 (all user-scoped tables +
  reference tables read-only).

```bash
psql "$DATABASE_URL" -f supabase/tests/runner_profile_rls.sql
psql "$DATABASE_URL" -f supabase/tests/canonical_schema_rls.sql
# or: supabase db execute --file <path>
```

### 2. App-level integration tests (CI, needs service key)
Seed real auth users with the `service_role` key, then read through anon clients
scoped to each user's own session — exactly like the app:
- `tests/rls/runner_profile.rls.test.ts` — Session 1.
- `tests/rls/canonical_schema.rls.test.ts` — Session 2 (every table).

```bash
# .env.local must contain SUPABASE_SERVICE_ROLE_KEY (Dashboard → Settings → API)
npm test
```

Without `SUPABASE_SERVICE_ROLE_KEY` the suite **skips loudly** (it never passes
vacuously). Use the DB-level proof above when the service key isn't available.
