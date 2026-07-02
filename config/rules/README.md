# /config/rules — advisor-owned rule config

**These files are DATA, not code (CLAUDE.md Golden rule 2).** They are the
versioned, typed rule tables the Evergreen Run engine reads. The engine
implements *against* them — it never invents them.

## Who owns what
- **The advisor** (physio-who-coaches) owns every clinical/training number here:
  RPE bands, progression caps, hard-day spacing, down-week cadence, pain and
  re-entry thresholds.
- **Code** implements the shape and the loader.
- **An LLM never generates or edits these values.** (Golden rule 1.)

## Signed vs draft
Numbers tagged `⟨advisor⟩` in the source are **UNSIGNED DRAFT placeholders** —
present only so the config is typed and loadable. They are **not** clinically
authoritative. Values tagged `(spec)` come from `docs/SPEC.md` (e.g. Durability
Index weights 40/25/20/15, ~80% easy, long-run ≤ ⅓, two strength days).

The active rule set reports `advisorSigned: false` and `status: "draft"` until:
1. the advisor signs off on every number, and
2. `RULE_SET_VERSION` in `version.ts` drops its `-draft` suffix, and
3. every intensity zone's `advisorSigned` is set to `true`.

## Changing a rule (the only correct procedure)
1. Edit the value in the relevant file here.
2. **Bump `RULE_SET_VERSION`** in `version.ts`.
3. **Update the golden tests** (`/tests/golden`, Session 4) to the new expected
   numbers. A golden test going red because a number changed is the system
   protecting a runner — investigate, don't just make it green.

Never hardcode any of these numbers in a component. Read them via
`import { getRuleSet } from "@/config/rules"`.

## Files
| File | Contents |
|---|---|
| `schema.ts` | Zod schemas + inferred types (the shape + data-domain bounds). |
| `version.ts` | `RULE_SET_VERSION` — stamped onto every Plan / snapshot. |
| `intensity-zones.ts` | Recovery / easy / steady / hard: talk-test + RPE band. |
| `weekly-plan.ts` | 80% easy, long-run ≤ ⅓, hard-day spacing, progression cap, down-week, life-happens re-entry, strength protection. |
| `durability-index.ts` | Sub-score weights (Load 40 / Strength 25 / Consistency 20 / Readiness 15). |
| `index.ts` | Loader: assembles, validates (throws on bad numbers), deep-freezes. |

No engine logic lives here — just typed config + the loader.
