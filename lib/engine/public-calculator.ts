import {
  durabilityIndex,
  type DurabilityIndexResult,
} from "@/lib/engine/durability-index";
import type { DurabilityInput } from "@/lib/engine/durability-index";
import type { CalculatorInput } from "@/lib/validation/calculator";

/**
 * Map the public quiz answers onto the engine's DurabilityInput. Pure. The
 * public calculator runs the SAME deterministic engine as the signed-in view —
 * it just sources its inputs from self-report instead of logged data.
 */
export function quizToDurabilityInput(a: CalculatorInput): DurabilityInput {
  return {
    // Minutes are a proxy for load; the ratio is unit-independent.
    acuteLoad: a.minutesThisWeek,
    chronicLoad: a.typicalMinutesPerWeek > 0 ? a.typicalMinutesPerWeek : null,
    strengthDaysThisWeek: a.strengthDays,
    weeksActiveInWindow: a.weeksActive,
    feel: {
      soreness: a.soreness,
      painIntensity: a.pain,
      morningStiffness: a.morningStiffness,
      fatigue: a.fatigue,
      confidence: a.confidence,
    },
  };
}

/** Run the deterministic engine on public quiz answers. */
export function runPublicCalculator(a: CalculatorInput): DurabilityIndexResult {
  return durabilityIndex(quizToDurabilityInput(a));
}
