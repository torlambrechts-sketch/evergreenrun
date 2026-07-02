import { getRuleSet, type RuleSet } from "@/config/rules";

/**
 * Deterministic pain-monitoring safety layer (Session 9).
 *
 * Golden rule 1 + the health-adjacent guardrails: NO LLM interprets symptoms.
 * This is pure code driven by advisor-owned thresholds in /config/rules. It
 * NEVER names a diagnosis and NEVER prescribes treatment. When something is
 * concerning it routes to "get this checked" and makes NO training change.
 */

/**
 * Red-flag ladder — self-reported symptoms that route straight to a clinician,
 * independent of pain intensity. This is a fixed clinical checklist (structure);
 * the advisor can extend it.
 */
export interface RedFlagSignals {
  painAtRest: boolean;
  nightPain: boolean;
  swelling: boolean;
  numbnessOrTingling: boolean;
  givingWay: boolean;
}

export interface SymptomInput {
  /** Reported pain intensity 0..10, or null if none. */
  painIntensity: number | null;
  /** Is the niggle settling within the monitoring window? null = unknown. */
  settling: boolean | null;
  redFlags: RedFlagSignals;
}

export type SafetySeverity = "monitor" | "downshift" | "clinician";

export interface SafetyAssessment {
  severity: SafetySeverity;
  /** false when there is genuinely nothing to flag (no pain, no red flags). */
  hasConcern: boolean;
  /** Calm, non-diagnostic headline shown to the user. */
  headline: string;
  detail: string;
  /** What happens to training. Clinician route makes NO change ("none"). */
  trainingAction: "continue_monitor" | "downshift" | "none";
  /** Machine-readable reasons for the red_flag_event audit trail. */
  reasons: string[];
  ruleSetVersion: string;
}

const RED_FLAG_LABELS: Record<keyof RedFlagSignals, string> = {
  painAtRest: "pain at rest",
  nightPain: "night pain",
  swelling: "swelling",
  numbnessOrTingling: "numbness or tingling",
  givingWay: "the joint giving way",
};

function activeRedFlags(flags: RedFlagSignals): string[] {
  return (Object.keys(flags) as Array<keyof RedFlagSignals>)
    .filter((k) => flags[k])
    .map((k) => RED_FLAG_LABELS[k]);
}

/**
 * Assess a symptom report. Pure and deterministic.
 */
export function assessSafety(
  input: SymptomInput,
  rules: RuleSet = getRuleSet(),
): SafetyAssessment {
  const p = rules.safetyRules.painMonitoring;
  const version = rules.version;
  const pain = input.painIntensity;
  const redFlags = activeRedFlags(input.redFlags);

  // Nothing to flag.
  if ((pain == null || pain === 0) && redFlags.length === 0) {
    return {
      severity: "monitor",
      hasConcern: false,
      headline: "Nothing to flag today.",
      detail: "No pain to keep an eye on. Carry on as planned.",
      trainingAction: "continue_monitor",
      reasons: [],
      ruleSetVersion: version,
    };
  }

  // Red-flag ladder OR high pain → clinician. No training tweak, no diagnosis.
  if (redFlags.length > 0 || (pain != null && pain >= p.clinicianMinIntensity)) {
    const reasons = [...redFlags];
    if (pain != null && pain >= p.clinicianMinIntensity) {
      reasons.push(`pain ${pain}/10`);
    }
    return {
      severity: "clinician",
      hasConcern: true,
      headline: "Worth getting this checked.",
      detail:
        "Some of what you've described is best looked at by a clinician (a physio or doctor). We won't change your training on this — please get it checked, and we'll pick things up from there.",
      trainingAction: "none",
      reasons,
      ruleSetVersion: version,
    };
  }

  // Downshift: pain in the mid band OR not settling.
  const midBandPain = pain != null && pain >= p.downshiftMinIntensity;
  if (midBandPain || input.settling === false) {
    const reasons: string[] = [];
    if (midBandPain) reasons.push(`pain ${pain}/10`);
    if (input.settling === false) {
      reasons.push(`not settling within ${p.settlingWindowHours}h`);
    }
    return {
      severity: "downshift",
      hasConcern: true,
      headline: "Let's ease back a little this week.",
      detail:
        "This is worth respecting, not worrying about. Keep runs easy and shorter for now, skip the hard day, and see how it settles. If it climbs or lingers, we'll suggest getting it checked.",
      trainingAction: "downshift",
      reasons,
      ruleSetVersion: version,
    };
  }

  // Continue + monitor: low pain that is settling.
  return {
    severity: "monitor",
    hasConcern: true,
    headline: "Looks like a normal niggle — keep going, keep an eye on it.",
    detail:
      "Mild and settling is part of running. Carry on as planned and check in again tomorrow. If it climbs above a 4, or stops settling, ease back.",
    trainingAction: "continue_monitor",
    reasons: pain != null ? [`pain ${pain}/10 settling`] : [],
    ruleSetVersion: version,
  };
}
