# Evergreen Run — Claude Code Build Kit

*How to build the app with Claude Code as a 6–12-month vibe coder without losing the thread. This is the operating manual; the prompts are copy-paste. Web first, mobile after Gate 2.*

---

## The one rule that saves you

**Never say "build the app." Build one vertical slice at a time, test it, commit, move on.**

A slice = one thin path through every layer (schema → security → API → UI → test) that a user can actually do. "Log a run" is a slice. "The training engine" is not — it's ten slices. Claude Code is brilliant at a slice and useless at a vision; you supply the vision, it supplies the slice. Every time you feel the urge to prompt something big, cut it smaller.

Two things make Evergreen Run different from a normal CRUD app, and they drive everything below:
1. **The engine is deterministic and lives as config (data, not code).** The Durability Index and plan rules are rule-tables your advisor signs — Claude implements *against* them, never invents them.
2. **There is a clinical safety layer.** An LLM narrates rule output; it never generates a training load, a symptom interpretation, or a rehab instruction. This is a hard architectural boundary, written into the rules file so Claude enforces it on itself.

---

## Day 0 — the three files you paste before writing any feature

### 1. `CLAUDE.md` (repo root) — Claude Code reads this every session. It is your leverage.

```markdown
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
```

### 2. `docs/ICEBOX.md` — the forbidden list, so scope creep is a named violation

```markdown
# ICEBOX — frozen until explicitly unfrozen (post Gate 2)
Social feed · Leaderboards · Kudos · Segment rankings · Public profiles ·
Race-first training plans · Native iOS/Android · Strava integration ·
Any AI chat / freeform AI coaching · Any second sport · Wearable auto-sync
(Garmin/Apple/Google) · Marketplace · Referral engine

Rule: if a prompt asks for any of these, Claude must stop and confirm before proceeding.
Vibe coding makes adding these feel free. They are not free — they blur the product.
```

### 3. `docs/SPEC.md` — paste the panel-corrected spec so Claude has the source of truth

Drop the content of your `run-for-life-technical-spec-v2.html` in here as markdown (the entities,
the MVP done-when list, the running rules, the safety boundaries). Claude Code refers to it instead
of you re-explaining the product every session.

---

## The build sequence — eleven sessions to MVP

Each session below is one sitting (your ~3–4h deep block). Run them **in order** — later slices
depend on earlier schema. Copy the prompt, let Claude plan first, then build. Do not skip ahead;
the dependency order is the point.

### Session 1 — Skeleton + auth + the RLS habit
> Set up the Next.js + TypeScript + Tailwind + shadcn + Supabase skeleton per CLAUDE.md.
> Implement email/magic-link auth and a `users` + `runner_profile` table with RLS so a user
> can only read their own profile. Include the negative test proving user B cannot read user A's
> profile. One protected page that shows "signed in as {email}". Plan the file list first.

### Session 2 — The data foundation (schema before features)
> Implement the full canonical schema from docs/SPEC.md as typed migrations WITH RLS on every
> table and a negative-access test for each: runner_profile, consent_record, safety_profile,
> run_activity (with source_hash), strength_session, feel_log (incl. pain_intensity,
> morning_stiffness, confidence), weekly_load, rule_set, red_flag_event, plan, planned_session,
> exercise, durability_index_snapshot. No UI yet — schema, RLS, types, and tests only.
> This is the load-bearing session; go slow and get RLS right.

### Session 3 — The rules config scaffold (data, not code)
> Create /config/rules as versioned, typed rule tables: the intensity zones (recovery/easy/steady/
> hard with talk-test + RPE), the weekly plan rules (80% easy, hard-day spacing, long-run ≤ ⅓,
> progression caps, down-week cadence, life-happens re-entry, strength-protection), and the
> Durability Index weights (Load 40 / Strength 25 / Consistency 20 / Readiness 15). Stamp each
> rule set with a version. Add a /config/rules/README that says these are advisor-owned and
> changing them requires updating golden tests. No engine logic yet — just the typed config + loader.

### Session 4 — Golden tests FIRST, then the Durability Index engine
> Before writing the engine: create a golden-test suite in /tests/golden with these canonical cases
> as input→expected tables (I will fill exact numbers with my advisor; scaffold them now):
> beginner, returner-with-low-chronic-load, 45+, 60+, high-soreness week, and Achilles-stiffness-
> 3/10-settling. THEN implement a deterministic durability_index() function that reads /config/rules
> and passes them. The function must be pure, explainable (return the sub-score breakdown), and
> stamped with rule_set_version. No LLM anywhere near this.

### Session 5 — Manual run logging (the first real user slice)
> Build the "log a run" slice: a ≤30-second form (distance, duration, optional pace/HR, RPE,
> talk-test) → validated with Zod → stored in run_activity → recomputes weekly_load. Include
> source_hash duplicate detection. Server component list of my runs. This is the first thing a
> user actually does — make it fast and kind.

### Session 6 — FIT/GPX upload (untrusted binary — isolate it)
> Add FIT/GPX file upload. Parse server-side in isolation with strict size/type validation,
> map to run_activity, dedup against manual entries via source_hash. Treat the file as hostile
> input: validate everything, never trust the payload. Retain the raw payload for future reprocessing.

### Session 7 — The Durability Score + the public calculator (Gate-1 funnel)
> Two slices. (a) An authenticated Durability Score view that runs the engine on my data and shows
> the score + sub-score breakdown, framed as "a baseline, not a grade." Persist a
> durability_index_snapshot each time. (b) A PUBLIC, account-free calculator page: a ≤10-input,
> ≤3-minute quiz that produces a shareable score result and captures an email → offers account
> upgrade. This public page is the Gate-1 marketing funnel; it must work with zero login.

### Session 8 — The weekly plan engine (the paid core)
> Implement the deterministic plan engine: given runner_profile + recent weekly_load + rules config,
> generate a Plan of PlannedSessions for the week following the Foundation program skeleton
> (easy days, one quality day, two strength days, long run capped, down-weeks). Stamp every Plan
> with rule_set_version. Include the walk-run on-ramp path for deconditioned/returning runners and
> the life-happens re-entry rule (reduce after a gap). Add golden tests for plan generation.
> The LLM does NOT generate plans — this is pure rules.

### Session 9 — Feel-log + the pain-monitoring boundary + red-flag engine (safety)
> Build the feel-log slice (soreness, pain area/intensity, morning stiffness, fatigue, weekly
> confidence item) AND the deterministic safety layer that interprets it: the pain-monitoring
> boundary (≤4/10 settling in 24h = continue+monitor; 5–6 or not-settling = downshift; red-flag
> ladder = clinician prompt, no training tweak) and the red_flag_event audit trail. Golden tests
> for the returner and Achilles cases must pass. Copy is calm and clear, never alarmist. No LLM
> interprets symptoms — deterministic rules only.

### Session 10 — Strength sessions + the coach note (the LLM's ONLY job)
> Two slices. (a) Strength A/B sessions from the exercise library (blocks: competence→load), with
> the HSR calf/Achilles tempo, logged to strength_session, feeding the Strength sub-score. Exercise
> entity carries contraindication flags + regression links so the engine can substitute, not skip.
> (b) The weekly coach note: take the DETERMINISTIC engine output (score, plan, flags) and use the
> LLM ONLY to phrase it warmly. The LLM receives structured rule output and returns language — it is
> given no freedom to change any number or add any prescription. Guardrail the prompt accordingly.

### Session 11 — Stripe paywall + notification-ethics + kindness copy pass
> Add Stripe web subscription (founding annual + monthly), with the free/paid boundary: public
> calculator + first score + a 2-week starter plan free; full engine + programs + coach note paid.
> Paywall appears after the value moment, not before. Implement the notification-ethics ruleset as
> a testable module (no guilt, no streak-loss threats, frequency caps, quiet hours, "you rested —
> good" reframes) with golden copy examples. Do a full copy pass against the kindness rules.

**At the end of Session 11 you have the MVP** — every "done-when" in the spec. Then: instrument the
Gate-1 calculator, ship the landing page under the evergreenrun.com name, and run the two-tagline test.

---

## Sessions 12+ (after Gate 2 passes) — unfreeze carefully

Only after the beta clears Gate 2 do you touch the icebox, and only these, in this order:
Comeback + Strong Runner programs → Life view + confidence trend → offline capture queue →
cross-training equivalence → THEN the Expo/React Native wrapper for mobile (the code you've written
is already the API + logic layer; the wrapper consumes it). Native + wearable sync are the reward
for validated retention, not a day-one cost.

---

## The habits that keep vibe coding from going sideways

- **Plan mode before anything non-trivial.** Make Claude restate the slice and list files before it
  writes. Catching a wrong plan costs one message; catching wrong code costs an evening.
- **One slice, one commit, working `main` always.** Never end a session on broken main. If a slice
  isn't done, `git stash` or a branch — future-you needs a green baseline to return to.
- **Review is a separate session from writing.** After Claude builds a slice, start a fresh prompt:
  "Review this slice against CLAUDE.md's definition of done — RLS negative test, no health data in
  logs, inputs validated, scope respected." Writing-Claude and reviewing-Claude catch different things.
- **When it drifts, don't wrestle a long thread — reset.** If a session gets confused (too many
  turns, tangled context), commit what works, start a new session, and point it at CLAUDE.md +
  the specific files. Fresh context beats a 40-message argument every time.
- **Golden tests are the tripwire.** Any time Claude touches the engine or a rule, the golden suite
  runs. If a number changes and a test goes red, that's the system protecting a runner — investigate,
  don't just update the expected value to make it green.
- **The advisor owns the numbers, you own the code, Claude owns the typing.** Don't let Claude invent
  a progression cap or a pain threshold. Those come from your physio-who-coaches into /config/rules;
  Claude implements them and tests them.
- **Protect one hour a week for the founder story content**, not the code. Ring-2 acquisition is that
  channel; the repo can be perfect and the funnel still starve.

---

## Guardrails specific to a health-adjacent product (paste-ready reminder for Claude)

> This app gives training guidance to real runners. Three hard boundaries, always:
> (1) No LLM output ever prescribes load, interprets a symptom, or gives rehab advice — the LLM only
> rephrases deterministic engine results. (2) Every clinical/training number is advisor-owned config
> with a golden test — never a literal in a component. (3) The app is a training tool, not a medical
> device: the red-flag layer routes concerning symptoms to "get this checked," and never names a
> diagnosis or prescribes treatment. If any slice would cross these, stop and flag it.
```
