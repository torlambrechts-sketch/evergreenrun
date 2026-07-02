# Deployment & environment (Session 1)

## Supabase project
- **Name:** Evergreenrun
- **Ref:** `hxkydpfjevepomqabdry`
- **Region:** eu-west-1 (EU, per CLAUDE.md)
- **URL:** https://hxkydpfjevepomqabdry.supabase.co

Migrations live in `supabase/migrations/`. They are already applied to the project.

## Environment variables
| Variable | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | client + server | Publishable key (`sb_publishable_…`). Safe for the browser. |
| `SUPABASE_SERVICE_ROLE_KEY` | server / CI only | Bypasses RLS. Only used by the RLS integration test. **Never** ship to the client or log it. |

Local: copy `.env.example` → `.env.local` and fill in. `.env.local` is gitignored.

## Supabase Auth config (do this in the dashboard — not yet automatable via MCP)
Auth → URL Configuration:
- **Site URL:** your production URL (e.g. `https://evergreenrun.com` or the Vercel domain).
- **Redirect URLs (allowlist):** add every origin the magic link may return to:
  - `http://localhost:3000/auth/callback`
  - `https://<your-vercel-project>.vercel.app/auth/callback`
  - `https://<preview>-*.vercel.app/auth/callback` (Vercel preview wildcard)
  - production domain `/auth/callback`

Email delivery uses Supabase's built-in SMTP by default (rate-limited). Configure a
custom SMTP provider before real usage.

## Vercel
Next.js is auto-detected — no `vercel.json` needed. On the Vercel project:
1. Connect this repo / branch.
2. Add the three env vars above (Production + Preview). Only `NEXT_PUBLIC_*` reach the browser.
3. Deploy. The build command is `next build`.

## Verifying the slice
```bash
npm run typecheck   # strict TS, no errors
npm run lint        # eslint clean
npm run build       # production build succeeds
npm test            # RLS integration test (skips loudly without SUPABASE_SERVICE_ROLE_KEY)
# DB-level RLS proof (no secrets needed):
#   psql "$DATABASE_URL" -f supabase/tests/runner_profile_rls.sql
```
Auth guard: hitting `/dashboard` while signed out 307-redirects to `/login?next=/dashboard`.
