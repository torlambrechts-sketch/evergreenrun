import { describe, expect, it } from "vitest";

import { renderDeterministicNote } from "@/lib/coach/deterministic-note";
import { validateCoachNote } from "@/lib/coach/guardrail";
import type { CoachNoteInput } from "@/lib/coach/types";

const base: CoachNoteInput = {
  firstName: "Sam",
  score: 62,
  subScores: { load: 80, strength: 50, consistency: 100, readiness: 60 },
  plan: {
    program: "foundation",
    targetWeeklyMinutes: 126,
    strengthDays: 2,
    hasQualityDay: true,
    isDownWeek: false,
    reEntry: false,
  },
  safety: { severity: "monitor", headline: "" },
  ruleSetVersion: "2026.07.02-draft",
};

describe("renderDeterministicNote", () => {
  it("frames the score as a baseline and includes plan facts", () => {
    const note = renderDeterministicNote(base);
    expect(note).toContain("baseline");
    expect(note).toContain("62");
    expect(note).toContain("126");
    // The kindness framing is explicitly "a baseline, not a grade".
    expect(note).toMatch(/not a grade/i);
  });

  it("routes a clinician flag to getting checked, with no diagnosis or tweak", () => {
    const note = renderDeterministicNote({
      ...base,
      safety: { severity: "clinician", headline: "" },
    });
    expect(note.toLowerCase()).toContain("clinician");
    expect(note).not.toMatch(/diagnos|tendinit|prescri/i);
  });
});

describe("validateCoachNote", () => {
  it("the deterministic note always passes its own guardrail", () => {
    for (const safety of ["monitor", "downshift", "clinician"] as const) {
      const input = { ...base, safety: { severity: safety, headline: "" } };
      const note = renderDeterministicNote(input);
      expect(validateCoachNote(input, note).ok).toBe(true);
    }
  });

  it("accepts a rephrase that only uses the engine's numbers", () => {
    const text = "Hi Sam — your baseline is 62 out of 100. This week is about 126 minutes with 2 strength days. Nice work.";
    expect(validateCoachNote(base, text).ok).toBe(true);
  });

  it("rejects an invented number", () => {
    const r = validateCoachNote(base, "Great week — go run 15 km on Saturday.");
    expect(r.ok).toBe(false);
    expect(r.reasons.join(" ")).toMatch(/invented number: 15/);
  });

  it("rejects diagnostic / prescriptive language", () => {
    expect(validateCoachNote(base, "This looks like Achilles tendinopathy.").ok).toBe(false);
    expect(validateCoachNote(base, "Take some ibuprofen for it.").ok).toBe(false);
    expect(validateCoachNote(base, "").ok).toBe(false);
  });
});
