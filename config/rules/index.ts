import {
  durabilityIndexScoring,
  durabilityIndexWeights,
} from "./durability-index";
import { intensityZones } from "./intensity-zones";
import { RuleSetSchema, type RuleSet } from "./schema";
import { RULE_SET_VERSION } from "./version";
import { weeklyPlanRules } from "./weekly-plan";

export * from "./schema";
export { RULE_SET_VERSION } from "./version";

/** Recursively freeze so no consumer can mutate loaded rules at runtime. */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value as object)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  }
  return value;
}

/**
 * Assemble, validate, and freeze the active rule set. Pure config — no engine
 * logic. Throws at import time if any value violates the schema (e.g. DI weights
 * that don't sum to 100), so a bad rule set can never reach the engine.
 *
 * The rule set is "signed" only when the version carries no `-draft` suffix AND
 * every intensity zone is advisor-signed. Until then it is a draft: structurally
 * valid, but not clinically authoritative.
 */
function loadRuleSet(): Readonly<RuleSet> {
  const isDraftVersion = RULE_SET_VERSION.includes("-draft");
  const allZonesSigned = intensityZones.every((z) => z.advisorSigned);
  const advisorSigned = !isDraftVersion && allZonesSigned;

  const candidate: RuleSet = {
    version: RULE_SET_VERSION,
    advisorSigned,
    status: advisorSigned ? "signed" : "draft",
    intensityZones,
    weeklyPlanRules,
    durabilityIndexWeights,
    durabilityIndexScoring,
  };

  // Validate at the boundary (Zod). Fails loudly on any bad number.
  const parsed = RuleSetSchema.parse(candidate);
  return deepFreeze(parsed);
}

/** The active, validated, frozen rule set. */
export const activeRuleSet: Readonly<RuleSet> = loadRuleSet();

/** Explicit accessor for engine code and tests. */
export function getRuleSet(): Readonly<RuleSet> {
  return activeRuleSet;
}
