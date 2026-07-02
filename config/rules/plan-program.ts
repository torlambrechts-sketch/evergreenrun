import type { FoundationProgram, WalkRunProgram } from "./schema";

/**
 * Program skeletons — which day of the week is which session type. Day 0 = Monday.
 *
 * ⟨advisor⟩ These layouts and the starting volumes are UNSIGNED DRAFT
 * placeholders so the plan engine is runnable and testable. The advisor owns the
 * program design; when signed, update here, bump RULE_SET_VERSION, and update the
 * plan golden tests.
 *
 * Foundation: 4 running days (2 easy, 1 quality, 1 long) + 2 strength + 1 rest.
 * Only the quality day is hard intensity — the long run is run easy — so the
 * 80/20 easy split and the long-run ≤ ⅓ cap both hold.
 */
export const foundationProgram: FoundationProgram = {
  startingWeeklyMinutes: 120, // ⟨advisor⟩ draft
  qualityShareOfWeek: 0.15, // ⟨advisor⟩ draft (capped by 1 - easyShareMin)
  days: [
    { dayOfWeek: 0, type: "strength" }, // Mon
    { dayOfWeek: 1, type: "easy" }, // Tue
    { dayOfWeek: 2, type: "quality" }, // Wed (only hard day)
    { dayOfWeek: 3, type: "strength" }, // Thu
    { dayOfWeek: 4, type: "rest" }, // Fri
    { dayOfWeek: 5, type: "long" }, // Sat (easy intensity)
    { dayOfWeek: 6, type: "easy" }, // Sun
  ],
};

/**
 * Walk-run on-ramp for deconditioned / returning runners: 3 walk-run days + 2
 * strength + 2 rest, lower starting volume, no quality/long yet.
 */
export const walkRunProgram: WalkRunProgram = {
  startingWeeklyMinutes: 60, // ⟨advisor⟩ draft
  days: [
    { dayOfWeek: 0, type: "strength" }, // Mon
    { dayOfWeek: 1, type: "walk_run" }, // Tue
    { dayOfWeek: 2, type: "rest" }, // Wed
    { dayOfWeek: 3, type: "walk_run" }, // Thu
    { dayOfWeek: 4, type: "strength" }, // Fri
    { dayOfWeek: 5, type: "walk_run" }, // Sat
    { dayOfWeek: 6, type: "rest" }, // Sun
  ],
};
