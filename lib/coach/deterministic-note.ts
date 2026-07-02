import type { CoachNoteInput } from "./types";

/**
 * Render a plain, kind coach note from deterministic engine output — NO LLM.
 * This is both the guaranteed-safe fallback and the source of truth the LLM
 * rephrasing is validated against. Copy follows the kindness rules: a score is a
 * baseline, never a grade; nothing here guilts or alarms.
 */
export function renderDeterministicNote(input: CoachNoteInput): string {
  const hi = input.firstName ? `Hi ${input.firstName}. ` : "";
  const parts: string[] = [];

  if (input.score != null) {
    parts.push(
      `Your Durability Score this week is a baseline of ${input.score} out of 100 — a starting point, not a grade.`,
    );
  }

  if (input.safety) {
    if (input.safety.severity === "clinician") {
      parts.push(
        "One thing you flagged is worth getting checked by a clinician. We won't change your training on it — please get it looked at, and we'll pick things up from there.",
      );
    } else if (input.safety.severity === "downshift") {
      parts.push(
        "Because of how you're feeling, this is a week to ease back a little — keep runs easy and shorter, and see how things settle.",
      );
    } else {
      parts.push("Nothing concerning on the health side — keep an eye on it and carry on.");
    }
  }

  if (input.plan) {
    const bits: string[] = [];
    bits.push(`about ${input.plan.targetWeeklyMinutes} minutes of running`);
    bits.push(
      `${input.plan.strengthDays} strength ${input.plan.strengthDays === 1 ? "day" : "days"}`,
    );
    if (input.plan.hasQualityDay) bits.push("one quality session");
    let planLine = `This week's plan: ${bits.join(", ")}.`;
    if (input.plan.isDownWeek) planLine += " It's a lighter down-week by design — that's how you stay durable.";
    if (input.plan.reEntry) planLine += " We've kept it gentle to ease you back after a break.";
    parts.push(planLine);
  }

  parts.push("Remember: progress is simply still running. Rest days count too.");

  return (hi + parts.join(" ")).trim();
}
