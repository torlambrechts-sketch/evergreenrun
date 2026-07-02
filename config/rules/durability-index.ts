import type { DurabilityIndexWeights } from "./schema";

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
