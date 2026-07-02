/**
 * Strength session builder (Session 10a). Pure and deterministic — no LLM.
 *
 * Given a session template (exercise slugs) and the runner's contraindications,
 * it resolves each exercise: if an exercise's contraindication flag matches the
 * runner's safety profile, it SUBSTITUTES the linked regression (never skips).
 */

export interface ExerciseLite {
  id: string;
  slug: string;
  name: string;
  block: string | null;
  tempo: string | null;
  contraindication_flags: string[];
  regression_of: string | null;
  instructions: string | null;
}

export interface ResolvedExercise {
  slug: string;
  name: string;
  tempo: string | null;
  instructions: string | null;
  substituted: boolean;
  note: string | null;
}

function firstMatchingFlag(
  flags: string[],
  contraindications: Set<string>,
): string | null {
  for (const f of flags) if (contraindications.has(f)) return f;
  return null;
}

export function buildStrengthSession(
  templateSlugs: string[],
  bySlug: Map<string, ExerciseLite>,
  byId: Map<string, ExerciseLite>,
  contraindications: string[],
): ResolvedExercise[] {
  const contra = new Set(contraindications);
  const resolved: ResolvedExercise[] = [];

  for (const slug of templateSlugs) {
    const ex = bySlug.get(slug);
    if (!ex) continue; // unknown slug — leave it out rather than guess

    const flag = firstMatchingFlag(ex.contraindication_flags, contra);
    if (!flag) {
      resolved.push({
        slug: ex.slug,
        name: ex.name,
        tempo: ex.tempo,
        instructions: ex.instructions,
        substituted: false,
        note: null,
      });
      continue;
    }

    // Contraindicated — substitute the regression if we have one.
    const regression = ex.regression_of ? byId.get(ex.regression_of) : undefined;
    if (regression) {
      resolved.push({
        slug: regression.slug,
        name: regression.name,
        tempo: regression.tempo,
        instructions: regression.instructions,
        substituted: true,
        note: `Adjusted for ${flag}: ${regression.name} instead of ${ex.name}.`,
      });
    } else {
      // No regression available — keep it but flag to take care (never silently skip).
      resolved.push({
        slug: ex.slug,
        name: ex.name,
        tempo: ex.tempo,
        instructions: ex.instructions,
        substituted: false,
        note: `Flagged for ${flag} — ease off or skip if it doesn't feel right.`,
      });
    }
  }

  return resolved;
}
