import type { CoachNoteInput } from "./types";

/**
 * Validate an LLM-rephrased coach note against the deterministic facts. The LLM's
 * ONLY job is to rephrase — so its output must not:
 *  - introduce any number that isn't one of the engine's facts, and
 *  - use diagnostic or prescriptive language.
 * Anything that fails here is rejected and the deterministic note is used instead.
 */

// Words that would mean the LLM named a diagnosis or prescribed treatment.
const FORBIDDEN = [
  "diagnos",
  "prescri",
  "ibuprofen",
  "naproxen",
  "paracetamol",
  "cortisone",
  "injection",
  "surgery",
  "mri",
  "x-ray",
  "tendinit",
  "tendinopath",
  "fracture",
  "rupture",
  "dosage",
  "milligram",
  /\bmg\b/,
];

function allowedNumbers(input: CoachNoteInput): Set<string> {
  const allowed = new Set<string>();
  const add = (n: number | null | undefined) => {
    if (n != null && Number.isFinite(n)) allowed.add(String(n));
  };
  add(input.score);
  add(100); // score scale
  if (input.subScores) {
    add(input.subScores.load);
    add(input.subScores.strength);
    add(input.subScores.consistency);
    add(input.subScores.readiness);
  }
  if (input.plan) {
    add(input.plan.targetWeeklyMinutes);
    add(input.plan.strengthDays);
  }
  // Small counts (days of the week, "one" quality session) legitimately appear.
  for (let i = 0; i <= 7; i++) allowed.add(String(i));
  return allowed;
}

export interface GuardrailResult {
  ok: boolean;
  reasons: string[];
}

export function validateCoachNote(
  input: CoachNoteInput,
  text: string,
): GuardrailResult {
  const reasons: string[] = [];
  const trimmed = text.trim();

  if (trimmed.length === 0) reasons.push("empty output");
  if (trimmed.length > 1500) reasons.push("output too long");

  const lower = trimmed.toLowerCase();
  for (const term of FORBIDDEN) {
    const hit = typeof term === "string" ? lower.includes(term) : term.test(lower);
    if (hit) reasons.push(`forbidden term: ${term}`);
  }

  const allowed = allowedNumbers(input);
  const numbers = trimmed.match(/\d+(?:\.\d+)?/g) ?? [];
  for (const n of numbers) {
    if (!allowed.has(n)) reasons.push(`invented number: ${n}`);
  }

  return { ok: reasons.length === 0, reasons };
}
