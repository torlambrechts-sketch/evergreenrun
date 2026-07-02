import { describe, expect, it } from "vitest";

import {
  DurabilityIndexWeightsSchema,
  RULE_SET_VERSION,
  getRuleSet,
} from "@/config/rules";

/**
 * Structural tests for the rule-config scaffold (Session 3). These check shape
 * and invariants only — the engine's golden number tests come in Session 4.
 */
describe("config/rules loader", () => {
  const rules = getRuleSet();

  it("loads a validated, version-stamped rule set", () => {
    expect(rules.version).toBe(RULE_SET_VERSION);
    expect(rules.intensityZones.length).toBeGreaterThanOrEqual(4);
  });

  it("carries the spec Durability Index weights summing to 100", () => {
    const w = rules.durabilityIndexWeights;
    expect(w).toEqual({ load: 40, strength: 25, consistency: 20, readiness: 15 });
    expect(w.load + w.strength + w.consistency + w.readiness).toBe(100);
  });

  it("encodes the spec weekly-plan invariants", () => {
    expect(rules.weeklyPlanRules.easyShareMin).toBe(0.8);
    expect(rules.weeklyPlanRules.longRunMaxShareOfWeeklyVolume).toBeCloseTo(1 / 3);
    expect(rules.weeklyPlanRules.strengthProtection.minStrengthDaysPerWeek).toBe(2);
  });

  it("is marked draft / unsigned until the advisor signs the numbers", () => {
    expect(rules.status).toBe("draft");
    expect(rules.advisorSigned).toBe(false);
  });

  it("is frozen so consumers cannot mutate rules at runtime", () => {
    expect(Object.isFrozen(rules)).toBe(true);
    expect(Object.isFrozen(rules.durabilityIndexWeights)).toBe(true);
  });

  it("rejects Durability Index weights that do not sum to 100", () => {
    const bad = DurabilityIndexWeightsSchema.safeParse({
      load: 40,
      strength: 25,
      consistency: 20,
      readiness: 10, // sums to 95
    });
    expect(bad.success).toBe(false);
  });
});
