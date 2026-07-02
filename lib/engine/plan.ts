import { getRuleSet, type RuleSet } from "@/config/rules";

/**
 * Deterministic weekly plan engine (Session 8) — the paid core.
 *
 * Golden rule 1: NO LLM. Pure rules only. Golden rule 2: every number comes from
 * /config/rules. Given a runner's recent load + the rule config, it produces a
 * week of sessions following the Foundation skeleton (easy days, one quality day,
 * two strength days, a capped long run), with a walk-run on-ramp for the
 * deconditioned/returning, down-weeks, and the life-happens re-entry reduction.
 * Every plan is stamped with rule_set_version.
 */

export type SessionType =
  | "easy"
  | "quality"
  | "long"
  | "strength"
  | "rest"
  | "walk_run";

export interface PlanInput {
  /** ISO Monday (YYYY-MM-DD) the plan is for. */
  weekStart: string;
  /** Use the walk-run on-ramp (deconditioned / returning). */
  onRamp: boolean;
  /** Last week's running minutes (load), or null when there's no history. */
  previousWeekMinutes: number | null;
  /** 0-based week number in the program, for down-week cadence. */
  weekIndex: number;
  /** Days since the runner's last run, or null. Drives life-happens re-entry. */
  daysSinceLastRun: number | null;
}

export interface PlannedSessionPlan {
  dayOfWeek: number;
  sessionType: SessionType;
  targetDurationS: number | null;
  targetZone: string | null;
  note: string | null;
}

export interface GeneratedPlan {
  weekStart: string;
  ruleSetVersion: string;
  program: "foundation" | "walk_run";
  isDownWeek: boolean;
  reEntryApplied: boolean;
  targetWeeklyMinutes: number;
  sessions: PlannedSessionPlan[];
}

const min2s = (m: number) => Math.round(m) * 60;

function zoneKey(rules: RuleSet, key: "easy" | "hard"): string | null {
  return rules.intensityZones.find((z) => z.key === key)?.key ?? null;
}

/** Apply down-week + re-entry multipliers to a base weekly volume. */
function adjustVolume(
  base: number,
  rules: RuleSet,
  isDownWeek: boolean,
  reEntryApplied: boolean,
): number {
  let v = base;
  if (isDownWeek) v *= rules.weeklyPlanRules.downWeek.loadMultiplier;
  if (reEntryApplied) v *= 1 - rules.weeklyPlanRules.lifeHappensReEntry.reductionPct;
  return v;
}

function buildFoundation(
  input: PlanInput,
  rules: RuleSet,
  isDownWeek: boolean,
  reEntryApplied: boolean,
): GeneratedPlan {
  const wp = rules.weeklyPlanRules;
  const fp = rules.foundationProgram;

  const base =
    input.previousWeekMinutes && input.previousWeekMinutes > 0
      ? input.previousWeekMinutes * (1 + wp.weeklyProgressionCapPct)
      : fp.startingWeeklyMinutes;
  const target = Math.round(adjustVolume(base, rules, isDownWeek, reEntryApplied));

  // Quality (the only hard session) is capped by the 80/20 easy rule.
  const maxHardShare = 1 - wp.easyShareMin;
  const includeQuality = !reEntryApplied; // ease back in gently after a gap
  const qualityMin = includeQuality
    ? Math.round(target * Math.min(fp.qualityShareOfWeek, maxHardShare))
    : 0;
  const longMin = Math.round(target * wp.longRunMaxShareOfWeeklyVolume);

  const easyDayCount = fp.days.filter((d) => d.type === "easy").length;
  const easyPool = Math.max(0, target - qualityMin - longMin);
  const perEasy = easyDayCount > 0 ? Math.round(easyPool / easyDayCount) : 0;

  const easy = zoneKey(rules, "easy");
  const hard = zoneKey(rules, "hard");

  const sessions: PlannedSessionPlan[] = fp.days.map((d) => {
    switch (d.type) {
      case "strength":
        return { dayOfWeek: d.dayOfWeek, sessionType: "strength", targetDurationS: null, targetZone: null, note: null };
      case "rest":
        return { dayOfWeek: d.dayOfWeek, sessionType: "rest", targetDurationS: null, targetZone: null, note: null };
      case "long":
        return { dayOfWeek: d.dayOfWeek, sessionType: "long", targetDurationS: min2s(longMin), targetZone: easy, note: "Keep it easy — time on feet, not pace." };
      case "quality":
        return includeQuality
          ? { dayOfWeek: d.dayOfWeek, sessionType: "quality", targetDurationS: min2s(qualityMin), targetZone: hard, note: null }
          : { dayOfWeek: d.dayOfWeek, sessionType: "easy", targetDurationS: min2s(perEasy), targetZone: easy, note: "Easing back in — all easy this week." };
      case "easy":
      default:
        return { dayOfWeek: d.dayOfWeek, sessionType: "easy", targetDurationS: min2s(perEasy), targetZone: easy, note: null };
    }
  });

  return {
    weekStart: input.weekStart,
    ruleSetVersion: rules.version,
    program: "foundation",
    isDownWeek,
    reEntryApplied,
    targetWeeklyMinutes: target,
    sessions,
  };
}

function buildWalkRun(
  input: PlanInput,
  rules: RuleSet,
  isDownWeek: boolean,
  reEntryApplied: boolean,
): GeneratedPlan {
  const wr = rules.walkRunProgram;
  const target = Math.round(
    adjustVolume(wr.startingWeeklyMinutes, rules, isDownWeek, reEntryApplied),
  );

  const runDays = wr.days.filter((d) => d.type === "walk_run").length;
  const perSession = runDays > 0 ? Math.round(target / runDays) : 0;
  const easy = zoneKey(rules, "easy");

  const sessions: PlannedSessionPlan[] = wr.days.map((d) => {
    switch (d.type) {
      case "walk_run":
        return { dayOfWeek: d.dayOfWeek, sessionType: "walk_run", targetDurationS: min2s(perSession), targetZone: easy, note: "Walk-run intervals at easy effort." };
      case "strength":
        return { dayOfWeek: d.dayOfWeek, sessionType: "strength", targetDurationS: null, targetZone: null, note: null };
      default:
        return { dayOfWeek: d.dayOfWeek, sessionType: "rest", targetDurationS: null, targetZone: null, note: null };
    }
  });

  return {
    weekStart: input.weekStart,
    ruleSetVersion: rules.version,
    program: "walk_run",
    isDownWeek,
    reEntryApplied,
    targetWeeklyMinutes: target,
    sessions,
  };
}

/** Generate a week's plan. Pure and deterministic. */
export function generatePlan(
  input: PlanInput,
  rules: RuleSet = getRuleSet(),
): GeneratedPlan {
  const wp = rules.weeklyPlanRules;
  const isDownWeek =
    input.weekIndex > 0 && input.weekIndex % wp.downWeek.everyNWeeks === 0;
  const reEntryApplied =
    input.daysSinceLastRun != null &&
    input.daysSinceLastRun >= wp.lifeHappensReEntry.triggerGapDays;

  return input.onRamp
    ? buildWalkRun(input, rules, isDownWeek, reEntryApplied)
    : buildFoundation(input, rules, isDownWeek, reEntryApplied);
}
