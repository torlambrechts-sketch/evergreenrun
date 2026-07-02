import { describe, expect, it } from "vitest";

import { isoWeekStart, isoWeekEnd } from "@/lib/util/week";
import { manualRunSourceHash } from "@/lib/util/source-hash";
import { summariseWeek } from "@/lib/db/weekly-load";

describe("isoWeekStart / isoWeekEnd", () => {
  it("maps any day to its ISO Monday (UTC)", () => {
    // 2026-07-02 is a Thursday -> week starts Monday 2026-06-29.
    expect(isoWeekStart("2026-07-02")).toBe("2026-06-29");
    expect(isoWeekStart("2026-06-29")).toBe("2026-06-29"); // Monday itself
    expect(isoWeekStart("2026-07-05")).toBe("2026-06-29"); // Sunday -> same week
    expect(isoWeekStart("2026-07-06")).toBe("2026-07-06"); // next Monday
  });

  it("ends the week exactly 7 days later", () => {
    expect(isoWeekEnd("2026-06-29")).toBe("2026-07-06");
  });
});

describe("manualRunSourceHash", () => {
  const base = { startedOn: "2026-07-02", distanceM: 5000, durationS: 1800 };

  it("is deterministic for identical runs (enables dedup)", () => {
    expect(manualRunSourceHash(base)).toBe(manualRunSourceHash({ ...base }));
  });

  it("differs when any field differs", () => {
    const h = manualRunSourceHash(base);
    expect(manualRunSourceHash({ ...base, distanceM: 5001 })).not.toBe(h);
    expect(manualRunSourceHash({ ...base, durationS: 1801 })).not.toBe(h);
    expect(manualRunSourceHash({ ...base, startedOn: "2026-07-03" })).not.toBe(h);
  });
});

describe("summariseWeek", () => {
  it("sums distance and duration and counts hard days by RPE", () => {
    const runs = [
      { distance_m: 5000, duration_s: 1800, rpe: 4 },
      { distance_m: 8000, duration_s: 2700, rpe: 8 }, // hard (>=7)
      { distance_m: 3000, duration_s: 1200, rpe: null },
    ];
    const s = summariseWeek(runs, 7);
    expect(s.total_distance_m).toBe(16000);
    expect(s.total_duration_s).toBe(5700);
    expect(s.hard_days).toBe(1);
  });

  it("treats missing values as zero and empty weeks as all-zero", () => {
    expect(summariseWeek([], 7)).toEqual({
      total_distance_m: 0,
      total_duration_s: 0,
      hard_days: 0,
    });
    const s = summariseWeek([{ distance_m: null, duration_s: null, rpe: 9 }], 7);
    expect(s).toEqual({ total_distance_m: 0, total_duration_s: 0, hard_days: 1 });
  });
});
