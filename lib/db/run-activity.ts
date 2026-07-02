import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Json, Tables, TablesInsert } from "@/lib/types/database.types";
import { runContentHash } from "@/lib/util/source-hash";
import { isoWeekStart } from "@/lib/util/week";
import { recomputeWeeklyLoad } from "@/lib/db/weekly-load";

export type RunActivity = Tables<"run_activity">;
type RunInsert = TablesInsert<"run_activity">;

export interface NewManualRun {
  date: string; // YYYY-MM-DD
  distanceM: number;
  durationS: number;
  rpe?: number;
  talkTest?: RunActivity["talk_test"];
  avgHr?: number;
}

export interface UploadedRun {
  source: "fit" | "gpx";
  sourceHash: string;
  startedAt: string | null; // ISO timestamp
  distanceM: number | null;
  durationS: number | null;
  rawPayload: Json;
}

export type LogRunResult =
  | { status: "created"; run: RunActivity }
  | { status: "duplicate" };

/** Pace in s/km from distance + duration, or null when either is missing/zero. */
function derivePace(distanceM: number | null, durationS: number | null): number | null {
  if (!distanceM || distanceM <= 0 || durationS == null) return null;
  return durationS / (distanceM / 1000);
}

/**
 * Insert one run for the signed-in user (RLS-scoped) and recompute the affected
 * week's load. Duplicate source_hash → "duplicate" instead of an error.
 */
async function insertRun(
  row: Omit<RunInsert, "user_id">,
  weekStart: string | null,
): Promise<LogRunResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("run_activity")
    .insert({ ...row, user_id: user.id })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return { status: "duplicate" }; // unique_violation
    throw error;
  }

  if (weekStart) await recomputeWeeklyLoad(weekStart);
  return { status: "created", run: data };
}

/** Insert a manually logged run. */
export async function logManualRun(input: NewManualRun): Promise<LogRunResult> {
  return insertRun(
    {
      source: "manual",
      source_hash: runContentHash({
        startedOn: input.date,
        distanceM: input.distanceM,
        durationS: input.durationS,
      }),
      started_at: `${input.date}T00:00:00.000Z`,
      distance_m: input.distanceM,
      duration_s: input.durationS,
      avg_pace_s_per_km: derivePace(input.distanceM, input.durationS),
      avg_hr: input.avgHr ?? null,
      rpe: input.rpe ?? null,
      talk_test: input.talkTest ?? null,
    },
    isoWeekStart(input.date),
  );
}

/** Insert a run imported from an uploaded FIT/GPX file (raw payload retained). */
export async function logUploadedRun(input: UploadedRun): Promise<LogRunResult> {
  return insertRun(
    {
      source: input.source,
      source_hash: input.sourceHash,
      started_at: input.startedAt,
      distance_m: input.distanceM,
      duration_s: input.durationS,
      avg_pace_s_per_km: derivePace(input.distanceM, input.durationS),
      raw_payload: input.rawPayload,
    },
    input.startedAt ? isoWeekStart(input.startedAt) : null,
  );
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
