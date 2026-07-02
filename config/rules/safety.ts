import type { SafetyRules } from "./schema";

/**
 * The pain-monitoring boundary. This is a clinical safety layer, so the ordering
 * of thresholds is load-bearing and the values are advisor-owned.
 *
 * From docs/SPEC.md: pain ≤4/10 that is settling within 24h → continue + monitor;
 * 5–6 or not settling → downshift; the red-flag ladder → clinician, no training
 * tweak. The clinician intensity cut-off is an ⟨advisor⟩ draft.
 */
export const safetyRules: SafetyRules = {
  painMonitoring: {
    continueMaxIntensity: 4, // (spec) ≤4/10 settling → continue + monitor
    downshiftMinIntensity: 5, // (spec) 5–6 → downshift
    clinicianMinIntensity: 7, // ⟨advisor⟩ draft — ≥7 → get this checked
    settlingWindowHours: 24, // (spec)
  },
};
