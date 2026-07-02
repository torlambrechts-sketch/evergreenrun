import { describe, expect, it } from "vitest";

import { RULE_SET_VERSION, getRuleSet } from "@/config/rules";
import { generatePlan, type GeneratedPlan, type SessionType } from "@/lib/engine/plan";

const rules = getRuleSet();
const wp = rules.weeklyPlanRules;

const count = (p: GeneratedPlan, t: SessionType) =>
  p.sessions.filter((s) => s.sessionType === t).length;
const minutesOf = (p: GeneratedPlan, t: SessionType) =>
  p.sessions.filter((s) => s.sessionType === t).reduce((a, s) => a + (s.targetDurationS ?? 0) / 60, 0);

const steady = {
  weekStart: "2026-06-29",
  onRamp: false,
  previousWeekMinutes: 120,
  weekIndex: 1,
  daysSinceLastRun: 1,
};

describe("plan engine — invariants", () => {
  it("a Foundation week has the right shape and is version-stamped", () => {
    const p = generatePlan(steady);
    expect(p.program).toBe("foundation");
    expect(p.sessions).toHaveLength(7);
    expect(p.ruleSetVersion).toBe(RULE_SET_VERSION);
    expect(count(p, "strength")).toBe(wp.strengthProtection.minStrengthDaysPerWeek);
    expect(count(p, "quality")).toBe(1);
    expect(count(p, "long")).toBe(1);
  });

  it("respects the long-run cap and the 80/20 easy split", () => {
    const p = generatePlan(steady);
    const longMin = minutesOf(p, "long");
    const qualityMin = minutesOf(p, "quality");
    // long run <= 1/3 of the week's target (allow 1 min rounding).
    expect(longMin).toBeLessThanOrEqual(p.targetWeeklyMinutes * wp.longRunMaxShareOfWeeklyVolume + 1);
    // hard-intensity minutes (quality) <= (1 - easyShareMin) of target.
    expect(qualityMin).toBeLessThanOrEqual(p.targetWeeklyMinutes * (1 - wp.easyShareMin) + 1);
  });

  it("is deterministic", () => {
    expect(generatePlan(steady)).toEqual(generatePlan(steady));
  });

  it("a new runner starts at the configured starting volume", () => {
    const p = generatePlan({ ...steady, previousWeekMinutes: null, weekIndex: 0 });
    expect(p.targetWeeklyMinutes).toBe(rules.foundationProgram.startingWeeklyMinutes);
  });

  it("progresses from last week within the weekly cap", () => {
    const p = generatePlan({ ...steady, previousWeekMinutes: 200, weekIndex: 1 });
    expect(p.targetWeeklyMinutes).toBe(Math.round(200 * (1 + wp.weeklyProgressionCapPct)));
    expect(p.isDownWeek).toBe(false);
  });

  it("inserts a down-week on the configured cadence (lower volume)", () => {
    const normal = generatePlan({ ...steady, previousWeekMinutes: 200, weekIndex: 1 });
    const down = generatePlan({ ...steady, previousWeekMinutes: 200, weekIndex: wp.downWeek.everyNWeeks });
    expect(down.isDownWeek).toBe(true);
    expect(down.targetWeeklyMinutes).toBeLessThan(normal.targetWeeklyMinutes);
  });

  it("applies the life-happens re-entry after a gap: gentler, no hard day", () => {
    const p = generatePlan({ ...steady, daysSinceLastRun: wp.lifeHappensReEntry.triggerGapDays });
    const normal = generatePlan(steady);
    expect(p.reEntryApplied).toBe(true);
    expect(count(p, "quality")).toBe(0); // hard session dropped
    expect(p.targetWeeklyMinutes).toBeLessThan(normal.targetWeeklyMinutes);
  });

  it("uses the walk-run on-ramp for deconditioned/returning runners", () => {
    const p = generatePlan({ ...steady, onRamp: true, previousWeekMinutes: null });
    expect(p.program).toBe("walk_run");
    expect(count(p, "walk_run")).toBeGreaterThanOrEqual(1);
    expect(count(p, "quality")).toBe(0);
    expect(count(p, "long")).toBe(0);
    expect(count(p, "strength")).toBeGreaterThanOrEqual(2);
  });
});

describe("plan engine — exact golden values (advisor-owned)", () => {
  // Fill these once the advisor signs program volumes; keeps the suite from
  // ever passing on invented per-session minutes.
  it.todo("Foundation steady week: exact per-session minutes");
  it.todo("Walk-run on-ramp: exact per-session minutes");
  it.todo("Down-week: exact reduced volume");
});
