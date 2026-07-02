import type {
  DurabilityIndexScoring,
  DurabilityIndexWeights,
} from "./schema";

/**
 * Durability Index sub-score weights. These come from docs/SPEC.md and are safe
 * to encode. They MUST sum to 100 (enforced by the schema at load time).
 *
 * Load 40 / Strength 25 / Consistency 20 / Readiness 15  (spec)
 */
export const durabilityIndexWeights: DurabilityIndexWeights = {
  load: 40,
  strength: 25,
  consistency: 20,
  readiness: 15,
};

/**
 * Scoring parameters that map raw signals to 0..100 sub-scores.
 *
 * ⟨advisor⟩ Every number below is an UNSIGNED DRAFT placeholder so the engine is
 * runnable and testable. They are NOT clinically signed. The advisor owns them;
 * when signed, update these values, bump RULE_SET_VERSION, and update the golden
 * tests in /tests/golden.
 */
export const durabilityIndexScoring: DurabilityIndexScoring = {
  load: {
    idealAcwrLow: 0.8, // ⟨advisor⟩ draft
    idealAcwrHigh: 1.3, // ⟨advisor⟩ draft
    zeroAtDeviation: 0.7, // ⟨advisor⟩ draft
    noChronicLoadSubScore: 50, // ⟨advisor⟩ draft (returner with no chronic history)
  },
  strength: {
    targetDaysPerWeek: 2, // (spec) two strength days
  },
  consistency: {
    windowWeeks: 4, // ⟨advisor⟩ draft
  },
  readiness: {
    freshnessWeight: 2, // ⟨advisor⟩ draft
    confidenceWeight: 1, // ⟨advisor⟩ draft
    noFeelSubScore: 60, // ⟨advisor⟩ draft
  },
};
