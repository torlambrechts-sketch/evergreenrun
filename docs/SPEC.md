# SPEC — Evergreen Run (source of truth)

> This is the panel-corrected product spec Claude Code refers to instead of re-explaining the
> product every session. It is derived from the build kit and the Evergreen Run technical spec.
>
> **How to use this file:** where a number is marked `⟨advisor⟩` it is a placeholder that the
> advisor (physio-who-coaches) owns. Claude implements *against* these numbers via `/config/rules`
> and golden tests — it never invents or hardcodes them. When the signed rule tables land, replace
> the placeholders here and in `/config/rules`, and update the golden tests together.

---

## Product

- **Who:** recreational runners 35+ who want to keep running for decades. Not a race app.
- **Promise:** "every week, know how to keep running without overdoing it."
- **Definition of progress:** still running. Durability, not speed.
- **Positioning:** a training *tool*, not a medical device.

---

## Architecture boundaries (hard, non-negotiable)

1. **Deterministic engine, LLM only narrates.** The Durability Index, plan generation, and symptom
   interpretation are pure deterministic code driven by versioned rule config. An LLM may only
   rephrase structured engine output into warm language — it never produces a load, a plan, a
   symptom interpretation, or rehab advice, and it may never change a number the engine emitted.
2. **The engine is data, not code.** All training/clinical rules live in `/config/rules` as typed,
   versioned tables, advisor-owned. Every rule set is stamped with a `rule_set_version`.
3. **Clinical safety layer.** Concerning symptoms route to "get this checked." The app never names a
   diagnosis and never prescribes treatment.
4. **Privacy.** RLS on every table (a user only reads/writes their own rows). No health data in
   analytics events or logs — behaviours and IDs only.
5. **Kindness is a spec.** No guilt, no streak-loss threats, no failure language. A low score is
   "a baseline," never "a grade."

---

## Canonical entities

These map to typed migrations, each with RLS on every table and a negative-access test proving
user B cannot read user A (see Session 2).

| Entity | Purpose / notable fields |
|---|---|
| `runner_profile` | Per-user running profile (age band, experience, goals, constraints). |
| `consent_record` | Consent captured for data processing and health-adjacent guidance. |
| `safety_profile` | Contraindications, injury history, red-flag baseline. |
| `run_activity` | A logged run. Carries `source_hash` for duplicate detection (manual + file upload). |
| `strength_session` | A logged strength session (A/B blocks; HSR calf/Achilles tempo). |
| `feel_log` | Subjective check-in: soreness, `pain_intensity`, pain area, `morning_stiffness`, fatigue, `confidence`. |
| `weekly_load` | Rolled-up weekly training load, recomputed on each run logged. |
| `rule_set` | Versioned pointer to the active advisor-owned rule config. |
| `red_flag_event` | Audit trail of red-flag triggers and the routed action. |
| `plan` | A generated week plan, stamped with `rule_set_version`. |
| `planned_session` | An individual prescribed session within a plan. |
| `exercise` | Exercise library entry; carries contraindication flags + regression links so the engine can substitute, not skip. |
| `durability_index_snapshot` | Persisted score + sub-score breakdown, stamped with `rule_set_version`. |

---

## The engine — rule config (`/config/rules`, advisor-owned)

Versioned, typed rule tables. No engine logic lives here — just the typed config + loader.
A `/config/rules/README` states these are advisor-owned and changing them requires updating golden tests.

### Intensity zones
Recovery / easy / steady / hard, each defined by talk-test + RPE band. `⟨advisor⟩` RPE ranges.

### Weekly plan rules
- ~80% of running easy.
- Hard-day spacing (minimum recovery between quality days).
- Long run ≤ ⅓ of weekly volume.
- Progression caps (weekly volume increase limit) — `⟨advisor⟩`.
- Down-week cadence — `⟨advisor⟩`.
- Life-happens re-entry: reduce load after a gap — `⟨advisor⟩` reduction/gap thresholds.
- Strength-protection: preserve the two strength days when trimming.

### Durability Index weights
Load **40** / Strength **25** / Consistency **20** / Readiness **15** (sums to 100).
The `durability_index()` function is pure, explainable (returns the sub-score breakdown), reads
`/config/rules`, and is stamped with `rule_set_version`. No LLM anywhere near it.

---

## Safety layer — pain-monitoring boundary (deterministic)

Interprets `feel_log` with no LLM in the path:

- **≤ 4/10, settling within 24h** → continue + monitor.
- **5–6/10, or not settling** → downshift (reduce load per rules).
- **Red-flag ladder** → clinician prompt ("get this checked"). No training tweak, no diagnosis,
  no treatment. Every trigger writes a `red_flag_event`.

Exact thresholds above are the advisor's; `⟨advisor⟩` confirms the settling window and bands.
Copy is calm and clear, never alarmist. Golden cases: the returner and the
Achilles-stiffness-3/10-settling case must pass.

---

## MVP — done-when (the eleven build sessions)

The MVP is complete when every item below works end-to-end in the browser.

1. **Skeleton + auth + RLS habit** — Next.js/TS/Tailwind/shadcn/Supabase skeleton; email/magic-link
   auth; `users` + `runner_profile` with RLS + negative test; one protected page shows "signed in as {email}".
2. **Data foundation** — full canonical schema as typed migrations, RLS on every table, a
   negative-access test for each. Schema, RLS, types, tests only — no UI.
3. **Rules config scaffold** — `/config/rules` typed versioned tables (zones, weekly plan rules,
   Durability Index weights) + loader + advisor-owned README. No engine logic yet.
4. **Golden tests first, then Durability Index engine** — golden suite in `/tests/golden`
   (beginner, returner-with-low-chronic-load, 45+, 60+, high-soreness week,
   Achilles-stiffness-3/10-settling) as input→expected; then the pure, explainable, versioned
   `durability_index()`.
5. **Manual run logging** — ≤30s form (distance, duration, optional pace/HR, RPE, talk-test) →
   Zod-validated → `run_activity` → recomputes `weekly_load`; `source_hash` dedup; run list.
6. **FIT/GPX upload** — server-side parse in isolation, strict size/type validation, treat file as
   hostile input, map to `run_activity`, dedup via `source_hash`, retain raw payload for reprocessing.
7. **Durability Score + public calculator (Gate-1 funnel)** — (a) authenticated score view with
   sub-score breakdown framed as "a baseline, not a grade," persists a `durability_index_snapshot`;
   (b) a PUBLIC, account-free ≤10-input, ≤3-minute quiz producing a shareable result and capturing
   an email → account upgrade. Works with zero login.
8. **Weekly plan engine (paid core)** — deterministic plan from profile + recent load + rules:
   easy days, one quality day, two strength days, long run capped, down-weeks; walk-run on-ramp for
   deconditioned/returning runners; life-happens re-entry. Every plan stamped with `rule_set_version`;
   golden tests for plan generation. LLM does NOT generate plans.
9. **Feel-log + pain-monitoring boundary + red-flag engine** — feel-log slice + deterministic safety
   layer (boundary above) + `red_flag_event` audit trail; returner and Achilles golden cases pass;
   calm copy; no LLM interprets symptoms.
10. **Strength sessions + coach note (LLM's ONLY job)** — (a) Strength A/B from the exercise library
    (competence→load blocks, HSR calf/Achilles tempo) → `strength_session`, feeding the Strength
    sub-score; exercises carry contraindication flags + regression links for substitution.
    (b) Weekly coach note: LLM takes deterministic engine output (score, plan, flags) and only
    phrases it warmly — no freedom to change a number or add a prescription; guardrailed prompt.
11. **Stripe paywall + notification-ethics + kindness copy pass** — Stripe web subscription
    (founding annual + monthly); free/paid boundary (public calculator + first score + 2-week
    starter plan free; full engine + programs + coach note paid); paywall after the value moment;
    notification-ethics as a testable module (no guilt, no streak-loss threats, frequency caps,
    quiet hours, "you rested — good" reframes) with golden copy examples; full kindness copy pass.

At the end of Session 11 the MVP satisfies every "done-when" here. Then instrument the Gate-1
calculator, ship the landing page under evergreenrun.com, and run the two-tagline test.

---

## Post-Gate-2 (icebox stays frozen until then)
Comeback + Strong Runner programs → Life view + confidence trend → offline capture queue →
cross-training equivalence → then an Expo/React Native wrapper consuming the existing API + logic
layer. Native + wearable sync are the reward for validated retention, not a day-one cost.
See `docs/ICEBOX.md` for the frozen list.

---

## Free / paid boundary
- **Free:** public calculator, first Durability Score, a 2-week starter plan.
- **Paid (founding annual + monthly):** full engine, programs, weekly coach note.
- Paywall appears **after** the value moment, never before.
