/**
 * Structured, DETERMINISTIC input to the weekly coach note. Every fact here comes
 * from the engines — the LLM (if used) may only rephrase these, never add to them.
 */
export interface CoachNoteInput {
  firstName: string | null;
  score: number | null;
  subScores: {
    load: number;
    strength: number;
    consistency: number;
    readiness: number;
  } | null;
  plan: {
    program: string;
    targetWeeklyMinutes: number;
    strengthDays: number;
    hasQualityDay: boolean;
    isDownWeek: boolean;
    reEntry: boolean;
  } | null;
  safety: {
    severity: "monitor" | "downshift" | "clinician";
    headline: string;
  } | null;
  ruleSetVersion: string;
}

export interface CoachNote {
  text: string;
  /** "llm" when the note was rephrased by the model, "deterministic" otherwise. */
  source: "llm" | "deterministic";
}
