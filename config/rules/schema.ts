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
});
export type RuleSet = z.infer<typeof RuleSetSchema>;
