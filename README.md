# Evergreen Run

Durability-first running app for recreational runners 35+. The promise: *every week, know how
to keep running without overdoing it.* Progress = still running.

See [`CLAUDE.md`](./CLAUDE.md) for the operating rules, [`docs/SPEC.md`](./docs/SPEC.md) for the
product spec, and [`docs/ICEBOX.md`](./docs/ICEBOX.md) for the frozen scope.

## Stack
Next.js (App Router) + TypeScript (strict) · Tailwind + shadcn/ui · Supabase (EU: Postgres + Auth + RLS) · Vercel.

## Getting started
```bash
cp .env.example .env.local   # fill in Supabase URL + publishable key
npm install
npm run dev                  # http://localhost:3000
```

## Scripts
| Script | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint |
| `npm test` | Vitest (RLS integration test) |

## What's built (Session 1)
Skeleton + magic-link auth + the RLS habit:
- Email magic-link auth (Supabase) with session refresh in `proxy.ts`.
- `users` + `runner_profile` tables, **owner-only RLS on both**, signup trigger.
- Negative-access proof that user B cannot read user A's profile
  (DB-level `supabase/tests/runner_profile_rls.sql`; app-level `tests/rls/`).
- Protected `/dashboard` showing "signed in as {email}".

Deployment and Supabase Auth config: see [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).
