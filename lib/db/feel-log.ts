import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  assessSafety,
  type RedFlagSignals,
  type SafetyAssessment,
} from "@/lib/engine/safety";

export interface FeelLogEntry {
  soreness?: number;
  painArea?: string;
  painIntensity?: number;
  morningStiffness?: number;
  fatigue?: number;
  confidence?: number;
  settling: boolean | null;
  redFlags: RedFlagSignals;
}

/**
 * Persist a feel-log, run the deterministic safety assessment, and — when there
 * is something to note — write an immutable red_flag_event audit row. Returns the
 * assessment so the UI can show calm, non-diagnostic guidance. RLS-scoped.
 */
export async function logFeelAndAssess(
  input: FeelLogEntry,
): Promise<SafetyAssessment> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: feel, error } = await supabase
    .from("feel_log")
    .insert({
      user_id: user.id,
      soreness: input.soreness ?? null,
      pain_area: input.painArea ?? null,
      pain_intensity: input.painIntensity ?? null,
      morning_stiffness: input.morningStiffness ?? null,
      fatigue: input.fatigue ?? null,
      confidence: input.confidence ?? null,
    })
    .select("id")
    .single();
  if (error || !feel) throw error ?? new Error("Could not save feel-log");

  const assessment = assessSafety({
    painIntensity: input.painIntensity ?? null,
    settling: input.settling,
    redFlags: input.redFlags,
  });

  // Audit trail: record any assessment that raised a concern.
  if (assessment.hasConcern) {
    const { error: rfErr } = await supabase.from("red_flag_event").insert({
      user_id: user.id,
      feel_log_id: feel.id,
      rule_set_version: assessment.ruleSetVersion,
      severity: assessment.severity,
      reason: assessment.reasons.join("; ") || null,
      action_taken: assessment.trainingAction,
    });
    if (rfErr) throw rfErr;
  }

  return assessment;
}
