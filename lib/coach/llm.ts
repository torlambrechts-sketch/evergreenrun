import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { renderDeterministicNote } from "./deterministic-note";
import { validateCoachNote } from "./guardrail";
import type { CoachNote, CoachNoteInput } from "./types";

/**
 * The LLM's ONLY job (Golden rule 1): turn deterministic engine output into warm
 * language. It is given the structured facts and strict rules, and its output is
 * validated by the guardrail before use. Anything unavailable, failed, or invalid
 * falls back to the deterministic note — the safe default always wins.
 *
 * Uses Claude Haiku 4.5 — a cheap, fast model well-suited to rephrasing.
 */
const MODEL = "claude-haiku-4-5";

const SYSTEM_PROMPT = `You rephrase a running app's deterministic coach output into a warm, plain, encouraging weekly note.

Hard rules — follow exactly:
- Use ONLY the facts in the JSON. Do not add, change, infer, or round any number.
- Never name a medical diagnosis. Never suggest medication, treatment, or a specific exercise, distance, or pace that isn't in the facts.
- If the facts say to see a clinician, keep that message and do not soften it into training advice.
- A score is a baseline, never a grade. Never use guilt, streak-loss, or failure language.
- Write 2 to 4 short sentences. Warm and human. No lists, no headings, no emoji.
Output only the note text.`;

export async function generateCoachNote(
  input: CoachNoteInput,
): Promise<CoachNote> {
  const deterministic = renderDeterministicNote(input);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { text: deterministic, source: "deterministic" };

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      temperature: 0.4,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: JSON.stringify(input) }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    const verdict = validateCoachNote(input, text);
    if (text && verdict.ok) return { text, source: "llm" };

    // Guardrail tripped — never show unvalidated LLM output.
    console.warn("[coach] LLM note rejected:", verdict.reasons.join(", "));
    return { text: deterministic, source: "deterministic" };
  } catch (err) {
    console.error("[coach] LLM note failed, using deterministic:", err);
    return { text: deterministic, source: "deterministic" };
  }
}
