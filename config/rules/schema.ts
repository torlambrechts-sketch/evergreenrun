import { z } from "zod";

/**
 * Typed, validated shape of an Evergreen Run rule set.
 *
 * The engine is DATA, not code (Golden rule 2). These schemas define the shape;
 * the values live in the sibling files and are assembled + validated by the
 * loader in ./index.ts. Nothing here contains engine logic — only structure and
 * data-domain bounds (e.g. RPE is 1..10). Changing a value = editing config +
 * updating golden tests, never hardcoding a number in a component.
 */

const rpe = z.number().int().min(1).max(10);
const share = z.number().min(0).max(1); // a proportion 0..1

// ---- Intensity zones (recovery / easy / steady / hard) ----
export const IntensityZoneSchema = z
  .object({
    key: z.enum(["recovery", "easy", "steady", "hard"]),
    label: z.string(),
    rpeMin: rpe,
    rpeMax: rpe,
    talkTest: z.string(),
    description: z.string(),
    /** false until the advisor signs this zone's RPE band. */
    advisorSigned: z.boolean(),
  })
  .refine((z) => z.rpeMin <= z.rpeMax, {
    message: "rpeMin must be <= rpeMax",
    path: ["rpeMin"],
  });
export type IntensityZone = z.infer<typeof IntensityZoneSchema>;

// ---- Program skeletons (which day is which) ----
export const SESSION_TYPES = [
  "easy",
  "quality",
  "long",
  "strength",
  "rest",
  "walk_run",
] as const;

export const ProgramDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Monday
  type: z.enum(SESSION_TYPES),
});
export type ProgramDay = z.infer<typeof ProgramDaySchema>;

export const FoundationProgramSchema = z.object({
  /** Starting weekly running minutes for a runner with no load history. ⟨advisor⟩ */
  startingWeeklyMinutes: z.number().positive(),
  /** Share of the week's minutes given to the one quality session. ⟨advisor⟩ */
  qualityShareOfWeek: share,
  /** The 7-day skeleton (which day is which session type). ⟨advisor⟩ */
  days: z.array(ProgramDaySchema).length(7),
});
export type FoundationProgram = z.infer<typeof FoundationProgramSchema>;

export const WalkRunProgramSchema = z.object({
  /** Starting weekly minutes for the deconditioned / returning on-ramp. ⟨advisor⟩ */
  startingWeeklyMinutes: z.number().positive(),
  days: z.array(ProgramDaySchema).length(7),
});
export type WalkRunProgram = z.infer<typeof WalkRunProgramSchema>;

// ---- Weekly plan rules ----
export const WeeklyPlanRulesSchema = z.object({
  /** Minimum share of running that must be easy (spec: ~80%). */
  easyShareMin: share,
  /** Long run capped at this share of weekly volume (spec: ≤ ⅓). */
  longRunMaxShareOfWeeklyVolume: share,
  /** Minimum recovery days between hard/quality days. ⟨advisor⟩ */
  minDaysBetweenHardDays: z.number().int().min(0),
  /** Max week-over-week volume increase. ⟨advisor⟩ */
  weeklyProgressionCapPct: share,
  downWeek: z.object({
    /** Insert a down-week every N weeks. ⟨advisor⟩ */
    everyNWeeks: z.number().int().min(1),
    /** Down-week volume multiplier vs prior week. ⟨advisor⟩ */
    loadMultiplier: share,
  }),
  lifeHappensReEntry: z.object({
    /** A gap of this many days triggers re-entry reduction. ⟨advisor⟩ */
    triggerGapDays: z.number().int().min(1),
    /** How much to reduce load on re-entry. ⟨advisor⟩ */
    reductionPct: share,
  }),
  strengthProtection: z.object({
    /** Preserve this many strength days when trimming (spec: two). */
    minStrengthDaysPerWeek: z.number().int().min(0),
  }),
});
export type WeeklyPlanRules = z.infer<typeof WeeklyPlanRulesSchema>;

// ---- Durability Index weights (must total 100) ----
export const DurabilityIndexWeightsSchema = z
  .object({
    load: z.number().min(0).max(100),
    strength: z.number().min(0).max(100),
    consistency: z.number().min(0).max(100),
    readiness: z.number().min(0).max(100),
  })
  .refine(
    (w) => w.load + w.strength + w.consistency + w.readiness === 100,
    { message: "Durability Index weights must sum to 100" },
  );
export type DurabilityIndexWeights = z.infer<
  typeof DurabilityIndexWeightsSchema
>;

// ---- Durability Index scoring parameters ----
// How each raw signal maps to a 0..100 sub-score. All ⟨advisor⟩ owned.
export const DurabilityIndexScoringSchema = z.object({
  load: z
    .object({
      /** Acute:chronic workload ratio band scored as 100. ⟨advisor⟩ */
      idealAcwrLow: z.number().min(0),
      idealAcwrHigh: z.number().min(0),
      /** ACWR deviation beyond the ideal band at which the sub-score hits 0. ⟨advisor⟩ */
      zeroAtDeviation: z.number().gt(0),
      /** Fallback sub-score when there is not enough chronic-load history. ⟨advisor⟩ */
      noChronicLoadSubScore: z.number().min(0).max(100),
    })
    .refine((v) => v.idealAcwrLow <= v.idealAcwrHigh, {
      message: "idealAcwrLow must be <= idealAcwrHigh",
      path: ["idealAcwrLow"],
    }),
  strength: z.object({
    /** Strength days/week that scores 100. ⟨advisor⟩ (spec: two) */
    targetDaysPerWeek: z.number().int().min(1),
  }),
  consistency: z.object({
    /** Look-back window (weeks) for the consistency sub-score. ⟨advisor⟩ */
    windowWeeks: z.number().int().min(1),
  }),
  readiness: z.object({
    /** Relative weight of physical freshness vs. self-reported confidence. ⟨advisor⟩ */
    freshnessWeight: z.number().min(0),
    confidenceWeight: z.number().min(0),
    /** Fallback sub-score when no feel-log is available. ⟨advisor⟩ */
    noFeelSubScore: z.number().min(0).max(100),
  }),
});
export type DurabilityIndexScoring = z.infer<
  typeof DurabilityIndexScoringSchema
>;

// ---- Safety: the pain-monitoring boundary ----
const rating0to10 = z.number().int().min(0).max(10);
export const SafetyRulesSchema = z.object({
  painMonitoring: z
    .object({
      /** Pain ≤ this AND settling → continue + monitor (spec: ≤4/10). */
      continueMaxIntensity: rating0to10,
      /** Pain ≥ this (and below clinician) → downshift (spec: 5–6). */
      downshiftMinIntensity: rating0to10,
      /** Pain ≥ this → route to a clinician, no training tweak. ⟨advisor⟩ */
      clinicianMinIntensity: rating0to10,
      /** Window in which a niggle should be settling (spec: 24h). */
      settlingWindowHours: z.number().int().positive(),
    })
    .refine(
      (v) =>
        v.continueMaxIntensity < v.downshiftMinIntensity &&
        v.downshiftMinIntensity <= v.clinicianMinIntensity,
      { message: "pain thresholds must be ordered: continue < downshift <= clinician" },
    ),
});
export type SafetyRules = z.infer<typeof SafetyRulesSchema>;

// ---- The assembled, versioned rule set ----
export const RuleSetSchema = z.object({
  /** Version stamp carried onto every Plan / snapshot the engine produces. */
  version: z.string().min(1),
  /** True only once the advisor has signed off on every number. */
  advisorSigned: z.boolean(),
  status: z.enum(["draft", "signed"]),
  intensityZones: z.array(IntensityZoneSchema).min(1),
  weeklyPlanRules: WeeklyPlanRulesSchema,
  durabilityIndexWeights: DurabilityIndexWeightsSchema,
  durabilityIndexScoring: DurabilityIndexScoringSchema,
  foundationProgram: FoundationProgramSchema,
  walkRunProgram: WalkRunProgramSchema,
  safetyRules: SafetyRulesSchema,
});
export type RuleSet = z.infer<typeof RuleSetSchema>;
