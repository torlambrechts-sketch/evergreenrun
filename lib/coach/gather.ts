import "server-only";

import { createClient } from "@/lib/supabase/server";
import { generateCoachNote } from "./llm";
import type { CoachNote, CoachNoteInput } from "./types";
import { isoWeekStart } from "@/lib/util/week";

/** Assemble the deterministic facts for the weekly coach note, then render it. */
export async function getCoachNote(now: Date = new Date()): Promise<CoachNote | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const weekStart = isoWeekStart(now);

  const [{ data: profile }, { data: snapshot }, { data: plan }, { data: flag }] =
    await Promise.all([
      supabase.from("runner_profile").select("display_name").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("durability_index_snapshot")
        .select("score, load_subscore, strength_subscore, consistency_subscore, readiness_subscore, rule_set_version")
        .eq("user_id", user.id)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("plan").select("id, program, rule_set_version").eq("user_id", user.id).eq("week_start", weekStart).maybeSingle(),
      supabase
        .from("red_flag_event")
        .select("severity")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  // Summarise the current plan from its sessions.
  let planFacts: CoachNoteInput["plan"] = null;
  if (plan) {
    const { data: sessions } = await supabase
      .from("planned_session")
      .select("session_type, target_duration_s")
      .eq("plan_id", plan.id);
    const rows = sessions ?? [];
    planFacts = {
      program: plan.program ?? "foundation",
      targetWeeklyMinutes: Math.round(
        rows.reduce((a, s) => a + (s.target_duration_s ?? 0), 0) / 60,
      ),
      strengthDays: rows.filter((s) => s.session_type === "strength").length,
      hasQualityDay: rows.some((s) => s.session_type === "quality"),
      isDownWeek: false, // not persisted on the plan row
      reEntry: false,
    };
  }

  const subScores =
    snapshot &&
    snapshot.load_subscore != null &&
    snapshot.strength_subscore != null &&
    snapshot.consistency_subscore != null &&
    snapshot.readiness_subscore != null
      ? {
          load: Math.round(snapshot.load_subscore),
          strength: Math.round(snapshot.strength_subscore),
          consistency: Math.round(snapshot.consistency_subscore),
          readiness: Math.round(snapshot.readiness_subscore),
        }
      : null;

  const input: CoachNoteInput = {
    firstName: profile?.display_name ?? null,
    score: snapshot ? Math.round(snapshot.score) : null,
    subScores,
    plan: planFacts,
    safety: flag ? { severity: flag.severity as "monitor" | "downshift" | "clinician", headline: "" } : null,
    ruleSetVersion:
      snapshot?.rule_set_version ?? plan?.rule_set_version ?? "unknown",
  };

  // Nothing to say yet.
  if (input.score == null && input.plan == null && input.safety == null) {
    return null;
  }

  return generateCoachNote(input);
}
