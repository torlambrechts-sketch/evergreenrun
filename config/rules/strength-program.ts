import type { StrengthProgram } from "./schema";

/**
 * Foundation strength sessions A and B, as ordered exercise slugs (competence
 * before load). The HSR calf raise carries the calf/Achilles tempo.
 *
 * ⟨advisor⟩ Draft session composition — not clinically signed. The engine
 * substitutes a regression when an exercise's contraindication flag matches the
 * runner's safety profile, so it adapts rather than skips.
 */
export const strengthProgram: StrengthProgram = {
  sessionA: ["hsr-calf-raise", "goblet-squat", "single-leg-rdl", "side-plank"],
  sessionB: ["hip-thrust", "step-up", "glute-bridge", "dead-bug"],
};
