# CLAUDE.md — Evergreen Run

## What this is
Evergreen Run is a durability-first running app for recreational runners 35+ who want to
run for decades. Not a race app. The promise: "every week, know how to keep running without
overdoing it." Progress = still running.

## Golden rules (violating these is a bug, not a style choice)
1. NEVER let an LLM generate training load, plan prescriptions, symptom interpretation, or
   rehab advice. The LLM only turns deterministic engine output into friendly language.
   All training/clinical logic is deterministic code driven by versioned rule config.
2. The engine is DATA, not code. Rules live in /config/rules as typed, versioned tables.
   Changing a rule = editing config + updating golden tests, never hardcoding a number in a component.
3. RLS on every table. A user can only ever read/write their own rows. Every table gets a
   negative test proving user B cannot read user A. No exceptions.
4. NO health data in analytics events or logs. Ever. Behaviours and IDs only.
5. Scope freeze: the features in /docs/ICEBOX.md are FORBIDDEN until told otherwise
   (no social feed, no leaderboards, no kudos, no native app, no Strava, no second sport,
   no AI chat). If I ask for one, remind me it's frozen and ask if I'm sure.
6. Kindness is a spec, not a vibe. User-facing copy for missed sessions, low scores, and
   notifications must never use guilt, streak-loss threats, or failure language.
   A low score is "a baseline," never "a grade."

## Stack (do not swap without asking)
- Next.js (App Router) + TypeScript (strict) + Tailwind + shadcn/ui
- Supabase (EU region): Postgres + Auth + RLS
- Stripe (web checkout) for subscriptions
- PostHog (EU) for product analytics — NO health data in events
- Deploy: Vercel

## Conventions
- Server components by default; client components only when interactivity requires it.
- All DB access goes through typed query functions in /lib/db — never inline SQL in components.
- Zod-validate every input at the boundary (forms, API routes, file parsers).
- One feature = one vertical slice = one PR-sized change. Do not scaffold ten files at once.
- Every schema change ships with its RLS policy AND its negative-access test in the same slice.

## Definition of done for any slice
- Types compile (strict), lint passes.
- RLS policy written + negative test passes.
- If it touches engine rules: golden tests pass.
- No secrets in code; inputs validated; no health data in logs/analytics.
- I can do the thing end-to-end in the browser.

## How to work with me
- Before building anything non-trivial, use plan mode: restate the slice, list the files you'll
  touch, name the acceptance check, flag anything out of scope. Wait for my go.
- Build the smallest version first. I will ask for more.
- If a request is actually several slices, say so and propose the order — don't attempt all of it.
- After a slice: summarise what changed, how to test it, and the single next slice you'd suggest.
