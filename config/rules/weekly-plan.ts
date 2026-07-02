import type { WeeklyPlanRules } from "./schema";

/**
 * Weekly plan rules.
 *
 * Values marked (spec) come straight from docs/SPEC.md and are safe to encode.
 * Values marked ⟨advisor⟩ are UNSIGNED DRAFT placeholders so the config loads;
 * the advisor owns them and they must be signed + golden-tested before use.
 */
export const weeklyPlanRules: WeeklyPlanRules = {
  easyShareMin: 0.8, // (spec) ~80% of running is easy
  longRunMaxShareOfWeeklyVolume: 1 / 3, // (spec) long run ≤ ⅓ of weekly volume

  minDaysBetweenHardDays: 2, // ⟨advisor⟩ draft
  weeklyProgressionCapPct: 0.1, // ⟨advisor⟩ draft (10%/week)

  downWeek: {
    everyNWeeks: 4, // ⟨advisor⟩ draft
    loadMultiplier: 0.7, // ⟨advisor⟩ draft
  },

  lifeHappensReEntry: {
    triggerGapDays: 10, // ⟨advisor⟩ draft
    reductionPct: 0.3, // ⟨advisor⟩ draft
  },

  strengthProtection: {
    minStrengthDaysPerWeek: 2, // (spec) two strength days
  },
};
