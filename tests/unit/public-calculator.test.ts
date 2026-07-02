import { describe, expect, it } from "vitest";

import { RULE_SET_VERSION } from "@/config/rules";
import {
  quizToDurabilityInput,
  runPublicCalculator,
} from "@/lib/engine/public-calculator";
import {
  CalculatorSchema,
  LeadCaptureSchema,
} from "@/lib/validation/calculator";

const answers = {
  runsThisWeek: 3,
  minutesThisWeek: 120,
  typicalMinutesPerWeek: 150,
  weeksActive: 4,
  strengthDays: 2,
  soreness: 2,
  pain: 1,
  morningStiffness: 1,
  fatigue: 3,
  confidence: 7,
};

describe("quizToDurabilityInput", () => {
  it("maps quiz answers onto the engine input", () => {
    const input = quizToDurabilityInput(answers);
    expect(input.acuteLoad).toBe(120);
    expect(input.chronicLoad).toBe(150);
    expect(input.strengthDaysThisWeek).toBe(2);
    expect(input.weeksActiveInWindow).toBe(4);
    expect(input.feel).toEqual({
      soreness: 2,
      painIntensity: 1,
      morningStiffness: 1,
      fatigue: 3,
      confidence: 7,
    });
  });

  it("treats zero typical minutes as no chronic history", () => {
    expect(quizToDurabilityInput({ ...answers, typicalMinutesPerWeek: 0 }).chronicLoad).toBeNull();
  });
});

describe("runPublicCalculator", () => {
  it("runs the same engine: bounded, version-stamped, deterministic", () => {
    const a = runPublicCalculator(answers);
    const b = runPublicCalculator(answers);
    expect(a).toEqual(b);
    expect(a.score).toBeGreaterThanOrEqual(0);
    expect(a.score).toBeLessThanOrEqual(100);
    expect(a.ruleSetVersion).toBe(RULE_SET_VERSION);
  });
});

describe("validation", () => {
  it("coerces string form values and rejects out-of-range ratings", () => {
    const ok = CalculatorSchema.safeParse({
      ...answers,
      minutesThisWeek: "120", // strings from the form
    });
    expect(ok.success).toBe(true);
    const bad = CalculatorSchema.safeParse({ ...answers, soreness: 11 });
    expect(bad.success).toBe(false);
  });

  it("normalises and validates the capture email", () => {
    const ok = LeadCaptureSchema.safeParse({ email: "  ME@Example.COM ", score: 62 });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.email).toBe("me@example.com");
    expect(LeadCaptureSchema.safeParse({ email: "nope", score: 62 }).success).toBe(false);
    expect(LeadCaptureSchema.safeParse({ email: "a@b.co", score: 200 }).success).toBe(false);
  });
});
