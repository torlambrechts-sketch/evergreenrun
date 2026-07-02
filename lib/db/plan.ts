import "server-only";

import { createClient } from "@/lib/supabase/server";
import { generatePlan, type GeneratedPlan, type PlanInput } from "@/lib/engine/plan";
import type { Tables } from "@/lib/types/database.types";
import { isoWeekStart } from "@/lib/util/week";

export type PlanRow = Tables<"plan">;
export type PlannedSessionRow = Tables<"planned_session">;

/** Runners on these experience levels get the full Foundation program. */
const FOUNDATION_LEVELS = new Set(["regular", "experienced", "advanced"]);

function daysBetween(fromIso: string, to: Date): number {
  const from = new Date(fromIso).getTime();
  return Math.floor((to.getTime() - from) / 86_400_000);
}

function weeksBetween(fromWeek: string, toWeek: string): number {
  const from = new Date(`${fromWeek}T00:00:00.000Z`).getTime();
  const to = new Date(`${toWeek}T00:00:00.000Z`).getTime();
  return Math.max(0, Math.round((to - from) / (7 * 86_400_000)));
}

/** Assemble the plan engine input from the signed-in user's stored data. */
async function gatherPlanInput(now: Date): Promise<PlanInput> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const currentWeekStart = isoWeekStart(now);
  const prevWeekStart = isoWeekStart(
    new Date(new Date(`${currentWeekStart}T00:00:00.000Z`).getTime() - 7 * 86_400_000),
  );

  const [{ data: profile }, { data: prevWeek }, { data: firstWeek }, { data: lastRun }] =
    await Promise.all([
      supabase.from("runner_profile").select("experience_level").eq("user_id", user.id).maybeSingle(),
      supabase.from("weekly_load").select("total_duration_s").eq("user_id", user.id).eq("week_start", prevWeekStart).maybeSingle(),
      supabase.from("weekly_load").select("week_start").eq("user_id", user.id).order("week_start", { ascending: true }).limit(1).maybeSingle(),
      supabase.from("run_activity").select("started_at").eq("user_id", user.id).order("started_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

  const onRamp = !FOUNDATION_LEVELS.has(profile?.experience_level ?? "");
  const previousWeekMinutes = prevWeek ? Math.round(prevWeek.total_duration_s / 60) : null;
  const weekIndex = firstWeek ? weeksBetween(firstWeek.week_start, currentWeekStart) : 0;
  const daysSinceLastRun = lastRun?.started_at ? daysBetween(lastRun.started_at, now) : null;

  return { weekStart: currentWeekStart, onRamp, previousWeekMinutes, weekIndex, daysSinceLastRun };
}

/**
 * Generate the current week's plan for the signed-in user and persist it
 * (upsert the plan row, replace its planned_sessions). RLS-scoped. Returns the
 * engine output.
 */
export async function generateAndSavePlan(now: Date = new Date()): Promise<GeneratedPlan> {
  const input = await gatherPlanInput(now);
  const plan = generatePlan(input);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: planRow, error: planErr } = await supabase
    .from("plan")
    .upsert(
      {
        user_id: user.id,
        week_start: plan.weekStart,
        rule_set_version: plan.ruleSetVersion,
        program: plan.program,
        status: "active",
      },
      { onConflict: "user_id,week_start" },
    )
    .select("id")
    .single();
  if (planErr || !planRow) throw planErr ?? new Error("Could not save plan");

  // Replace this plan's sessions.
  const { error: delErr } = await supabase.from("planned_session").delete().eq("plan_id", planRow.id);
  if (delErr) throw delErr;

  const { error: insErr } = await supabase.from("planned_session").insert(
    plan.sessions.map((s) => ({
      plan_id: planRow.id,
      user_id: user.id,
      day_of_week: s.dayOfWeek,
      session_type: s.sessionType,
      target_duration_s: s.targetDurationS,
      target_zone: s.targetZone,
      notes: s.note,
    })),
  );
  if (insErr) throw insErr;

  return plan;
}

/** The current week's persisted plan + its sessions (ordered by day), or null. */
export async function getCurrentPlan(
  now: Date = new Date(),
): Promise<{ plan: PlanRow; sessions: PlannedSessionRow[] } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: plan, error } = await supabase
    .from("plan")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start", isoWeekStart(now))
    .maybeSingle();
  if (error) throw error;
  if (!plan) return null;

  const { data: sessions, error: sErr } = await supabase
    .from("planned_session")
    .select("*")
    .eq("plan_id", plan.id)
    .order("day_of_week", { ascending: true });
  if (sErr) throw sErr;

  return { plan, sessions: sessions ?? [] };
}
