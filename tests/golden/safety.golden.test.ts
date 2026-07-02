import { describe, expect, it } from "vitest";

import { RULE_SET_VERSION } from "@/config/rules";
import {
  assessSafety,
  type RedFlagSignals,
  type SymptomInput,
} from "@/lib/engine/safety";

const noFlags: RedFlagSignals = {
  painAtRest: false,
  nightPain: false,
  swelling: false,
  numbnessOrTingling: false,
  givingWay: false,
};

const input = (over: Partial<SymptomInput>): SymptomInput => ({
  painIntensity: null,
  settling: true,
  redFlags: noFlags,
  ...over,
});

describe("pain-monitoring boundary — canonical cases", () => {
  it("Achilles stiffness 3/10 that is settling → continue + monitor", () => {
    const a = assessSafety(input({ painIntensity: 3, settling: true }));
    expect(a.severity).toBe("monitor");
    expect(a.trainingAction).toBe("continue_monitor");
    expect(a.hasConcern).toBe(true);
  });

  it("Achilles 3/10 that is NOT settling → downshift", () => {
    const a = assessSafety(input({ painIntensity: 3, settling: false }));
    expect(a.severity).toBe("downshift");
    expect(a.trainingAction).toBe("downshift");
  });

  it("returner with pain 4/10 settling → continue + monitor", () => {
    expect(assessSafety(input({ painIntensity: 4, settling: true })).severity).toBe("monitor");
  });

  it("returner with pain 5/10 → downshift", () => {
    expect(assessSafety(input({ painIntensity: 5, settling: true })).severity).toBe("downshift");
  });
});

describe("pain-monitoring boundary — red-flag ladder", () => {
  it("high pain (7/10) → clinician, and makes NO training change", () => {
    const a = assessSafety(input({ painIntensity: 7 }));
    expect(a.severity).toBe("clinician");
    expect(a.trainingAction).toBe("none");
  });

  it("a red flag overrides low pain → clinician", () => {
    const a = assessSafety(
      input({ painIntensity: 2, redFlags: { ...noFlags, nightPain: true } }),
    );
    expect(a.severity).toBe("clinician");
    expect(a.trainingAction).toBe("none");
    expect(a.reasons).toContain("night pain");
  });

  it("clinician copy routes to getting checked, never a diagnosis or tweak", () => {
    const a = assessSafety(input({ painIntensity: 8 }));
    expect(a.detail.toLowerCase()).toContain("clinician");
    expect(a.trainingAction).toBe("none");
  });
});

describe("pain-monitoring boundary — invariants", () => {
  it("no pain and no flags → nothing to flag", () => {
    const a = assessSafety(input({ painIntensity: 0 }));
    expect(a.hasConcern).toBe(false);
    expect(a.severity).toBe("monitor");
  });

  it("is deterministic and version-stamped", () => {
    const i = input({ painIntensity: 5, settling: false });
    expect(assessSafety(i)).toEqual(assessSafety(i));
    expect(assessSafety(i).ruleSetVersion).toBe(RULE_SET_VERSION);
  });
});
