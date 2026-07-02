import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database.types";
import { manualRunSourceHash } from "@/lib/util/source-hash";
import { isoWeekStart } from "@/lib/util/week";
import { recomputeWeeklyLoad } from "@/lib/db/weekly-load";

export type RunActivity = Tables<"run_activity">;

export interface NewManualRun {
  date: string; // YYYY-MM-DD
  distanceM: number;
  durationS: number;
  rpe?: number;
  talkTest?: RunActivity["talk_test"];
  avgHr?: number;
}

export type LogRunResult =
  | { status: "created"; run: RunActivity }
  | { status: "duplicate" };

/**
 * Insert a manually logged run for the signed-in user, then recompute that
 * week's load. Duplicate submissions (same day + distance + duration) are caught
 * by the (user_id, source_hash) unique index and reported as "duplicate" instead
 * of erroring. All access is RLS-scoped to the caller.
 */
export async function logManualRun(input: NewManualRun): Promise<LogRunResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const sourceHash = manualRunSourceHash({
    startedOn: input.date,
    distanceM: input.distanceM,
    durationS: input.durationS,
  });

  // Derive pace from distance + duration so the form stays short.
  const paceSecPerKm =
    input.distanceM > 0
      ? (input.durationS / (input.distanceM / 1000))
      : null;

  const { data, error } = await supabase
    .from("run_activity")
    .insert({
      user_id: user.id,
      source: "manual",
      source_hash: sourceHash,
      started_at: `${input.date}T00:00:00.000Z`,
      distance_m: input.distanceM,
      duration_s: input.durationS,
      avg_pace_s_per_km: paceSecPerKm,
      avg_hr: input.avgHr ?? null,
      rpe: input.rpe ?? null,
      talk_test: input.talkTest ?? null,
    })
    .select("*")
    .single();

  if (error) {
    // 23505 = unique_violation -> duplicate source_hash for this user.
    if (error.code === "23505") return { status: "duplicate" };
    throw error;
  }

  await recomputeWeeklyLoad(isoWeekStart(input.date));
  return { status: "created", run: data };
}

/** The signed-in user's most recent runs (RLS-scoped). */
export async function listMyRuns(limit = 50): Promise<RunActivity[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("run_activity")
    .select("*")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
