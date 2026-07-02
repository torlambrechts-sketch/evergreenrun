import "server-only";

import { getRuleSet } from "@/config/rules";
import { createClient } from "@/lib/supabase/server";
import {
  durabilityIndex,
  type DurabilityIndexResult,
  type FeelSignals,
} from "@/lib/engine/durability-index";
import { buildDurabilityInput } from "@/lib/engine/gather";
import type { Json, Tables } from "@/lib/types/database.types";
import { isoWeekStart } from "@/lib/util/week";

export type DurabilitySnapshot = Tables<"durability_index_snapshot">;

/** Gather the signed-in user's data and run the engine (no persistence). */
async function computeForCurrentUser(
  now: Date,
): Promise<DurabilityIndexResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const windowWeeks =
    getRuleSet().durabilityIndexScoring.consistency.windowWeeks;
  const currentWeekStart = isoWeekStart(now);

  // Earliest week we care about: (windowWeeks - 1) weeks before the current one.
  const earliest = new Date(`${currentWeekStart}T00:00:00.000Z`);
  earliest.setUTCDate(earliest.getUTCDate() - (windowWeeks - 1) * 7);
  const earliestWeek = earliest.toISOString().slice(0, 10);

  const [{ data: weekly }, { data: strength }, { data: feelRow }] =
    await Promise.all([
      supabase
        .from("weekly_load")
        .select("week_start, total_distance_m, total_duration_s")
        .eq("user_id", user.id)
        .gte("week_start", earliestWeek),
      supabase
        .from("strength_session")
        .select("id")
        .eq("user_id", user.id)
        .gte("performed_at", `${currentWeekStart}T00:00:00.000Z`),
      supabase
        .from("feel_log")
        .select("soreness, pain_intensity, morning_stiffness, fatigue, confidence")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const feel: FeelSignals | null = feelRow
    ? {
        soreness: feelRow.soreness,
        painIntensity: feelRow.pain_intensity,
        morningStiffness: feelRow.morning_stiffness,
        fatigue: feelRow.fatigue,
        confidence: feelRow.confidence,
      }
    : null;

  const input = buildDurabilityInput({
    weeklyLoads: weekly ?? [],
    currentWeekStart,
    strengthDaysThisWeek: strength?.length ?? 0,
    feel,
    windowWeeks,
  });

  return durabilityIndex(input);
}

/**
 * Compute the current Durability Index for the signed-in user AND persist a
 * durability_index_snapshot (RLS-scoped). Returns the engine result.
 */
export async function computeAndSaveSnapshot(
  now: Date = new Date(),
): Promise<DurabilityIndexResult> {
  const result = await computeForCurrentUser(now);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("durability_index_snapshot").insert({
    user_id: user.id,
    rule_set_version: result.ruleSetVersion,
    score: result.score,
    load_subscore: result.breakdown.load.subScore,
    strength_subscore: result.breakdown.strength.subScore,
    consistency_subscore: result.breakdown.consistency.subScore,
    readiness_subscore: result.breakdown.readiness.subScore,
    breakdown: result.breakdown as unknown as Json,
  });
  if (error) throw error;

  return result;
}

/** The signed-in user's most recent persisted snapshot, or null. */
export async function getLatestSnapshot(): Promise<DurabilitySnapshot | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("durability_index_snapshot")
    .select("*")
    .eq("user_id", user.id)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
