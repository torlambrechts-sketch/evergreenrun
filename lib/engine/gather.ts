import type { DurabilityInput, FeelSignals } from "@/lib/engine/durability-index";

/**
 * Pure assembly of the engine's DurabilityInput from a user's stored data.
 * Kept free of DB I/O so it is fully unit-testable. The DB layer
 * (lib/db/durability.ts) fetches the rows and calls this.
 *
 * "Load" here is a transparent proxy: minutes of running per ISO week
 * (total_duration_s). Acute = the most recent week; chronic = the mean over the
 * window. This is arithmetic aggregation, not an advisor-owned clinical number —
 * the ACWR band that judges the ratio lives in /config/rules.
 */
export interface WeeklyLoadLite {
  week_start: string; // YYYY-MM-DD
  total_distance_m: number;
  total_duration_s: number;
}

export function buildDurabilityInput(params: {
  weeklyLoads: WeeklyLoadLite[];
  currentWeekStart: string;
  strengthDaysThisWeek: number;
  feel: FeelSignals | null;
  windowWeeks: number;
}): DurabilityInput {
  const { currentWeekStart, strengthDaysThisWeek, feel, windowWeeks } = params;

  // Most-recent-first, limited to the window.
  const weeks = [...params.weeklyLoads]
    .sort((a, b) => (a.week_start < b.week_start ? 1 : -1))
    .slice(0, windowWeeks);

  const currentWeek = weeks.find((w) => w.week_start === currentWeekStart);
  const acuteRow = currentWeek ?? weeks[0];
  const acuteLoad = acuteRow ? acuteRow.total_duration_s : null;

  // Chronic average needs at least two weeks of history to be meaningful.
  const chronicLoad =
    weeks.length >= 2
      ? weeks.reduce((a, w) => a + w.total_duration_s, 0) / weeks.length
      : null;

  const weeksActiveInWindow = weeks.filter((w) => w.total_distance_m > 0).length;

  return {
    acuteLoad,
    chronicLoad,
    strengthDaysThisWeek,
    weeksActiveInWindow,
    feel,
  };
}
