import "server-only";

import { getRuleSet } from "@/config/rules";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database.types";
import { isoWeekEnd } from "@/lib/util/week";

type RunRow = Pick<
  Tables<"run_activity">,
  "distance_m" | "duration_s" | "rpe"
>;

export interface WeekSummary {
  total_distance_m: number;
  total_duration_s: number;
  hard_days: number;
}

/**
 * Pure aggregation of a week's runs. `hardRpeMin` comes from the rule config's
 * hard intensity zone — a run counts as "hard" when its RPE reaches that band.
 * No advisor number is hardcoded here.
 */
export function summariseWeek(runs: RunRow[], hardRpeMin: number): WeekSummary {
  return runs.reduce<WeekSummary>(
    (acc, r) => {
      acc.total_distance_m += r.distance_m ?? 0;
      acc.total_duration_s += r.duration_s ?? 0;
      if (r.rpe != null && r.rpe >= hardRpeMin) acc.hard_days += 1;
      return acc;
    },
    { total_distance_m: 0, total_duration_s: 0, hard_days: 0 },
  );
}

/** RPE at which a run is considered "hard", from the active rule config. */
function hardRpeMinFromRules(): number {
  const hard = getRuleSet().intensityZones.find((z) => z.key === "hard");
  return hard?.rpeMin ?? 7;
}

/**
 * Recompute weekly_load for the signed-in user's given ISO week by re-summing
 * their run_activity rows for that week and upserting the row. Runs through the
 * user's RLS-scoped session, so it can only ever touch the caller's own data.
 */
export async function recomputeWeeklyLoad(weekStart: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: runs, error } = await supabase
    .from("run_activity")
    .select("distance_m, duration_s, rpe")
    .eq("user_id", user.id)
    .gte("started_at", `${weekStart}T00:00:00.000Z`)
    .lt("started_at", `${isoWeekEnd(weekStart)}T00:00:00.000Z`);
  if (error) throw error;

  const summary = summariseWeek(runs ?? [], hardRpeMinFromRules());

  const { error: upsertError } = await supabase
    .from("weekly_load")
    .upsert(
      { user_id: user.id, week_start: weekStart, ...summary },
      { onConflict: "user_id,week_start" },
    );
  if (upsertError) throw upsertError;
}
