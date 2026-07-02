import { describe, expect, it } from "vitest";

import { buildDurabilityInput } from "@/lib/engine/gather";

describe("buildDurabilityInput", () => {
  const feel = {
    soreness: 2,
    painIntensity: 1,
    morningStiffness: 1,
    fatigue: 2,
    confidence: 7,
  };

  it("returns nulls / zeros when there is no data", () => {
    const input = buildDurabilityInput({
      weeklyLoads: [],
      currentWeekStart: "2026-06-29",
      strengthDaysThisWeek: 0,
      feel: null,
      windowWeeks: 4,
    });
    expect(input.acuteLoad).toBeNull();
    expect(input.chronicLoad).toBeNull();
    expect(input.weeksActiveInWindow).toBe(0);
    expect(input.feel).toBeNull();
  });

  it("uses the current week as acute and needs 2+ weeks for chronic", () => {
    const one = buildDurabilityInput({
      weeklyLoads: [
        { week_start: "2026-06-29", total_distance_m: 5000, total_duration_s: 1800 },
      ],
      currentWeekStart: "2026-06-29",
      strengthDaysThisWeek: 1,
      feel,
      windowWeeks: 4,
    });
    expect(one.acuteLoad).toBe(1800);
    expect(one.chronicLoad).toBeNull(); // only one week
    expect(one.weeksActiveInWindow).toBe(1);
    expect(one.strengthDaysThisWeek).toBe(1);
  });

  it("computes chronic as the window mean and counts active weeks", () => {
    const input = buildDurabilityInput({
      weeklyLoads: [
        { week_start: "2026-06-29", total_distance_m: 6000, total_duration_s: 2000 },
        { week_start: "2026-06-22", total_distance_m: 4000, total_duration_s: 1600 },
        { week_start: "2026-06-15", total_distance_m: 0, total_duration_s: 0 },
      ],
      currentWeekStart: "2026-06-29",
      strengthDaysThisWeek: 2,
      feel,
      windowWeeks: 4,
    });
    expect(input.acuteLoad).toBe(2000); // current week
    expect(input.chronicLoad).toBeCloseTo((2000 + 1600 + 0) / 3);
    expect(input.weeksActiveInWindow).toBe(2); // the zero week doesn't count
  });

  it("limits to the window and still finds the current week as acute", () => {
    const weeks = [
      { week_start: "2026-06-29", total_distance_m: 6000, total_duration_s: 2000 },
      { week_start: "2026-06-22", total_distance_m: 4000, total_duration_s: 1500 },
      { week_start: "2026-06-15", total_distance_m: 4000, total_duration_s: 1500 },
      { week_start: "2026-06-08", total_distance_m: 4000, total_duration_s: 1500 },
      { week_start: "2026-06-01", total_distance_m: 9999, total_duration_s: 9999 },
    ];
    const input = buildDurabilityInput({
      weeklyLoads: weeks,
      currentWeekStart: "2026-06-29",
      strengthDaysThisWeek: 0,
      feel: null,
      windowWeeks: 4,
    });
    // Oldest week (2026-06-01) is outside the 4-week window and ignored.
    expect(input.acuteLoad).toBe(2000);
    expect(input.chronicLoad).toBeCloseTo((2000 + 1500 + 1500 + 1500) / 4);
    expect(input.weeksActiveInWindow).toBe(4);
  });
});
