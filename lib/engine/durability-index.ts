import { getRuleSet, type RuleSet } from "@/config/rules";

/**
 * Deterministic Durability Index engine (Session 4).
 *
 * Golden rule 1: NO LLM is involved here. This is pure, explainable code driven
 * entirely by the advisor-owned rule config. Golden rule 2: every number it uses
 * comes from /config/rules — nothing clinical is hardcoded here.
 *
 * The function is pure (same input → same output), returns the full sub-score
 * breakdown so a result can always be explained, and stamps the rule_set_version
 * it was computed under.
 */

/** Subjective check-in signals (0..10). Higher soreness/pain/etc. is worse; higher confidence is better. */
export interface FeelSignals {
  soreness: number | null;
  painIntensity: number | null;
  morningStiffness: number | null;
  fatigue: number | null;
  confidence: number | null;
}

export interface DurabilityInput {
  /** Acute (recent, e.g. 7-day) training load. */
  acuteLoad: number | null;
  /** Chronic (e.g. 28-day average) training load. */
  chronicLoad: number | null;
  /** Strength sessions completed this week. */
  strengthDaysThisWeek: number;
  /** Number of weeks with >=1 run inside the consistency window. */
  weeksActiveInWindow: number;
  /** Most recent feel-log, or null if none. */
  feel: FeelSignals | null;
}

export interface SubScore {
  key: "load" | "strength" | "consistency" | "readiness";
  /** 0..100 sub-score before weighting. */
  subScore: number;
  /** Weight (0..100) from config. */
  weight: number;
  /** subScore * weight / 100 — contribution to the total. */
  weighted: number;
  /** Human-readable explanation of how this sub-score was derived. */
  rationale: string;
}

export interface DurabilityIndexResult {
  /** Total Durability Index, 0..100 (rounded). */
  score: number;
  ruleSetVersion: string;
  /** True only if the rules it was computed from are advisor-signed. */
  advisorSigned: boolean;
  breakdown: {
    load: SubScore;
    strength: SubScore;
    consistency: SubScore;
    readiness: SubScore;
  };
}

const clamp = (n: number, lo = 0, hi = 100): number =>
  Math.max(lo, Math.min(hi, n));
const round1 = (n: number): number => Math.round(n * 10) / 10;

function loadSubScore(
  input: DurabilityInput,
  rules: RuleSet,
): { subScore: number; rationale: string } {
  const p = rules.durabilityIndexScoring.load;
  const { acuteLoad, chronicLoad } = input;

  if (chronicLoad == null || chronicLoad <= 0 || acuteLoad == null) {
    return {
      subScore: p.noChronicLoadSubScore,
      rationale:
        "Not enough chronic-load history to judge load ramp; using the config fallback.",
    };
  }

  const acwr = acuteLoad / chronicLoad;
  if (acwr >= p.idealAcwrLow && acwr <= p.idealAcwrHigh) {
    return {
      subScore: 100,
      rationale: `Acute:chronic ratio ${round1(acwr)} is inside the ideal band [${p.idealAcwrLow}, ${p.idealAcwrHigh}].`,
    };
  }

  const deviation =
    acwr < p.idealAcwrLow ? p.idealAcwrLow - acwr : acwr - p.idealAcwrHigh;
  const subScore = clamp(100 - (deviation / p.zeroAtDeviation) * 100);
  const side = acwr < p.idealAcwrLow ? "below" : "above";
  return {
    subScore,
    rationale: `Acute:chronic ratio ${round1(acwr)} is ${side} the ideal band; deviation ${round1(deviation)}.`,
  };
}

function strengthSubScore(
  input: DurabilityInput,
  rules: RuleSet,
): { subScore: number; rationale: string } {
  const target = rules.durabilityIndexScoring.strength.targetDaysPerWeek;
  const subScore = clamp((input.strengthDaysThisWeek / target) * 100);
  return {
    subScore,
    rationale: `${input.strengthDaysThisWeek} of ${target} target strength day(s) this week.`,
  };
}

function consistencySubScore(
  input: DurabilityInput,
  rules: RuleSet,
): { subScore: number; rationale: string } {
  const window = rules.durabilityIndexScoring.consistency.windowWeeks;
  const subScore = clamp((input.weeksActiveInWindow / window) * 100);
  return {
    subScore,
    rationale: `Active in ${input.weeksActiveInWindow} of the last ${window} week(s).`,
  };
}

function readinessSubScore(
  input: DurabilityInput,
  rules: RuleSet,
): { subScore: number; rationale: string } {
  const p = rules.durabilityIndexScoring.readiness;
  const feel = input.feel;
  if (!feel) {
    return {
      subScore: p.noFeelSubScore,
      rationale: "No feel-log available; using the config fallback.",
    };
  }

  // Physical freshness from the "worse-is-higher" signals (0..10 each).
  const bad = [
    feel.soreness,
    feel.painIntensity,
    feel.morningStiffness,
    feel.fatigue,
  ].filter((v): v is number => v != null);
  const freshness =
    bad.length > 0
      ? 1 - bad.reduce((a, b) => a + b, 0) / bad.length / 10
      : null; // 0..1

  const confidence = feel.confidence != null ? feel.confidence / 10 : null; // 0..1

  // Weighted blend of whichever signals are present.
  const parts: Array<{ value: number; weight: number }> = [];
  if (freshness != null) parts.push({ value: freshness, weight: p.freshnessWeight });
  if (confidence != null) parts.push({ value: confidence, weight: p.confidenceWeight });

  if (parts.length === 0) {
    return {
      subScore: p.noFeelSubScore,
      rationale: "Feel-log had no usable signals; using the config fallback.",
    };
  }

  const totalWeight = parts.reduce((a, b) => a + b.weight, 0);
  const blended =
    totalWeight > 0
      ? parts.reduce((a, b) => a + b.value * b.weight, 0) / totalWeight
      : parts.reduce((a, b) => a + b.value, 0) / parts.length;

  return {
    subScore: clamp(blended * 100),
    rationale: "Blended physical freshness and self-reported confidence.",
  };
}

/**
 * Compute the Durability Index for one runner snapshot. Pure and deterministic.
 */
export function durabilityIndex(
  input: DurabilityInput,
  rules: RuleSet = getRuleSet(),
): DurabilityIndexResult {
  const w = rules.durabilityIndexWeights;

  const parts = {
    load: { ...loadSubScore(input, rules), key: "load" as const, weight: w.load },
    strength: {
      ...strengthSubScore(input, rules),
      key: "strength" as const,
      weight: w.strength,
    },
    consistency: {
      ...consistencySubScore(input, rules),
      key: "consistency" as const,
      weight: w.consistency,
    },
    readiness: {
      ...readinessSubScore(input, rules),
      key: "readiness" as const,
      weight: w.readiness,
    },
  };

  const breakdown = Object.fromEntries(
    Object.entries(parts).map(([k, v]) => [
      k,
      {
        key: v.key,
        subScore: round1(v.subScore),
        weight: v.weight,
        weighted: round1((v.subScore * v.weight) / 100),
        rationale: v.rationale,
      } satisfies SubScore,
    ]),
  ) as DurabilityIndexResult["breakdown"];

  const total = round1(
    Object.values(breakdown).reduce((a, b) => a + b.weighted, 0),
  );

  return {
    score: Math.round(total),
    ruleSetVersion: rules.version,
    advisorSigned: rules.advisorSigned,
    breakdown,
  };
}
