import { describe, expect, it } from "vitest";

import { RULE_SET_VERSION, getRuleSet } from "@/config/rules";
import { durabilityIndex } from "@/lib/engine/durability-index";
import { goldenCases } from "./cases";

/**
 * Golden suite for the Durability Index engine.
 *
 * Two layers:
 *  1. INVARIANTS — properties that must hold for EVERY case regardless of the
 *     exact advisor numbers (bounded scores, weighting math, determinism,
 *     monotonic direction). These run now and guard against regressions.
 *  2. EXACT VALUES — the advisor-owned score for each canonical case. Registered
 *     as `it.todo` until `expected` is filled in cases.ts, so the suite can never
 *     pass on invented numbers.
 */

describe("durability_index — invariants (all cases)", () => {
  it.each(goldenCases)("$name: score and sub-scores are bounded 0..100", (c) => {
    const r = durabilityIndex(c.input);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    for (const sub of Object.values(r.breakdown)) {
      expect(sub.subScore).toBeGreaterThanOrEqual(0);
      expect(sub.subScore).toBeLessThanOrEqual(100);
    }
  });

  it.each(goldenCases)("$name: weighted sub-scores reconstruct the score", (c) => {
    const r = durabilityIndex(c.input);
    const summed = Object.values(r.breakdown).reduce((a, b) => a + b.weighted, 0);
    // score is the rounded total; allow the rounding delta.
    expect(Math.abs(summed - r.score)).toBeLessThanOrEqual(0.5 + 0.05);
  });

  it.each(goldenCases)("$name: is deterministic and version-stamped", (c) => {
    const a = durabilityIndex(c.input);
    const b = durabilityIndex(c.input);
    expect(a).toEqual(b);
    expect(a.ruleSetVersion).toBe(RULE_SET_VERSION);
    expect(a.advisorSigned).toBe(getRuleSet().advisorSigned);
  });

  it("more strength days never lowers the strength sub-score", () => {
    const base = goldenCases[0].input;
    const low = durabilityIndex({ ...base, strengthDaysThisWeek: 0 });
    const high = durabilityIndex({ ...base, strengthDaysThisWeek: 2 });
    expect(high.breakdown.strength.subScore).toBeGreaterThanOrEqual(
      low.breakdown.strength.subScore,
    );
  });

  it("higher soreness never raises the readiness sub-score", () => {
    const base = goldenCases[2].input; // has a feel-log
    const fresh = durabilityIndex({
      ...base,
      feel: { ...base.feel!, soreness: 0 },
    });
    const sore = durabilityIndex({
      ...base,
      feel: { ...base.feel!, soreness: 10 },
    });
    expect(sore.breakdown.readiness.subScore).toBeLessThanOrEqual(
      fresh.breakdown.readiness.subScore,
    );
  });
});

describe("durability_index — exact golden values (advisor-owned)", () => {
  for (const c of goldenCases) {
    if (!c.expected) {
      // Not signed off yet — appears as a pending TODO, never as a pass.
      it.todo(`${c.name}: exact score pending advisor numbers`);
      continue;
    }
    const expected = c.expected;
    it(`${c.name}: matches the advisor-signed expected values`, () => {
      const r = durabilityIndex(c.input);
      expect(r.score).toBe(expected.score);
      if (expected.load !== undefined) expect(r.breakdown.load.subScore).toBe(expected.load);
      if (expected.strength !== undefined) expect(r.breakdown.strength.subScore).toBe(expected.strength);
      if (expected.consistency !== undefined) expect(r.breakdown.consistency.subScore).toBe(expected.consistency);
      if (expected.readiness !== undefined) expect(r.breakdown.readiness.subScore).toBe(expected.readiness);
    });
  }
});
