# /tests/golden — the engine tripwire

Golden tests pin the deterministic engine's output for canonical runner cases.
**These expected numbers are advisor-owned.** When a number in `/config/rules`
changes and a golden test goes red, that is the system protecting a runner —
investigate, don't just edit the expected value to make it green (CLAUDE.md).

## How it works
- `cases.ts` — the canonical inputs (beginner, returner-with-low-chronic-load,
  45+, 60+, high-soreness week, Achilles-stiffness-3/10-settling) plus an
  `expected` field per case.
- `expected: null` means **the advisor has not signed a number yet**. The exact
  assertion for that case is registered as `it.todo` — it shows as pending and
  never passes. This is deliberate: the suite must never go green on numbers an
  LLM invented.
- Invariant tests (bounds, weighting math, determinism, monotonic direction) run
  against every case now and guard against regressions regardless of the exact
  numbers.

## Filling in advisor numbers
1. Get the signed values from the advisor for each case.
2. Set `expected` in `cases.ts` (score, and optionally sub-scores).
3. Make sure `/config/rules` matches the signed rule set and bump
   `RULE_SET_VERSION`.
4. Run `npm test`. The `it.todo` entries become real assertions.
