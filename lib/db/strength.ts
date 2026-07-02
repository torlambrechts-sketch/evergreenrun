import "server-only";

import { getRuleSet } from "@/config/rules";
import { createClient } from "@/lib/supabase/server";
import {
  buildStrengthSession,
  type ExerciseLite,
  type ResolvedExercise,
} from "@/lib/engine/strength";

export type StrengthSessionType = "A" | "B";

/**
 * Resolve strength session A or B for the signed-in user, substituting
 * regressions for any exercise contraindicated by their safety profile.
 */
export async function getStrengthSession(
  sessionType: StrengthSessionType,
): Promise<ResolvedExercise[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const rules = getRuleSet();
  const template =
    sessionType === "A"
      ? rules.strengthProgram.sessionA
      : rules.strengthProgram.sessionB;

  const [{ data: exercises, error: exErr }, { data: safety }] = await Promise.all([
    supabase
      .from("exercise")
      .select("id, slug, name, block, tempo, contraindication_flags, regression_of, instructions"),
    supabase
      .from("safety_profile")
      .select("contraindications")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  if (exErr) throw exErr;

  const rows = (exercises ?? []) as ExerciseLite[];
  const bySlug = new Map(rows.map((e) => [e.slug, e]));
  const byId = new Map(rows.map((e) => [e.id, e]));

  return buildStrengthSession(
    template,
    bySlug,
    byId,
    safety?.contraindications ?? [],
  );
}

/** Log a completed strength session (feeds the Strength sub-score). RLS-scoped. */
export async function logStrengthSession(
  sessionType: StrengthSessionType,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("strength_session")
    .insert({ user_id: user.id, session_type: sessionType });
  if (error) throw error;
}
