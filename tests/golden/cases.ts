import type { DurabilityInput } from "@/lib/engine/durability-index";

/**
 * Canonical golden cases for the Durability Index (Session 4).
 *
 * INPUTS describe each archetypal runner. EXPECTED numbers are ADVISOR-OWNED and
 * are left `null` until the advisor fills them in with their signed rule set.
 * While `expected` is null, the exact-value assertion for that case is registered
 * as `it.todo` (it does NOT pass) — so the suite can never go green on numbers an
 * LLM invented. Invariant checks still run against every case.
 *
 * When the advisor provides numbers: fill `expected`, ensure RULE_SET_VERSION and
 * /config/rules match, and the exact assertions activate automatically.
 */
export interface ExpectedDurability {
  /** Expected total score (0..100). */
  score: number;
  /** Optional expected sub-scores (0..100). */
  load?: number;
  strength?: number;
  consistency?: number;
  readiness?: number;
}

export interface GoldenCase {
  name: string;
  description: string;
  input: DurabilityInput;
  expected: ExpectedDurability | null;
}

export const goldenCases: GoldenCase[] = [
  {
    name: "beginner",
    description: "New runner: light load, little strength, short history.",
    input: {
      acuteLoad: 120,
      chronicLoad: 110,
      strengthDaysThisWeek: 0,
      weeksActiveInWindow: 2,
      feel: {
        soreness: 3,
        painIntensity: 0,
        morningStiffness: 1,
        fatigue: 3,
        confidence: 6,
      },
    },
    expected: null, // ⟨advisor⟩ TODO
  },
  {
    name: "returner-with-low-chronic-load",
    description:
      "Coming back after a long gap: some acute load but essentially no chronic base.",
    input: {
      acuteLoad: 200,
      chronicLoad: null,
      strengthDaysThisWeek: 1,
      weeksActiveInWindow: 1,
      feel: {
        soreness: 4,
        painIntensity: 1,
        morningStiffness: 2,
        fatigue: 5,
        confidence: 4,
      },
    },
    expected: null, // ⟨advisor⟩ TODO
  },
  {
    name: "age-45-plus",
    description: "Experienced 45+ runner in a steady, well-balanced week.",
    input: {
      acuteLoad: 320,
      chronicLoad: 300,
      strengthDaysThisWeek: 2,
      weeksActiveInWindow: 4,
      feel: {
        soreness: 2,
        painIntensity: 0,
        morningStiffness: 1,
        fatigue: 2,
        confidence: 8,
      },
    },
    expected: null, // ⟨advisor⟩ TODO
  },
  {
    name: "age-60-plus",
    description: "60+ runner, conservative load, consistent, prioritising strength.",
    input: {
      acuteLoad: 240,
      chronicLoad: 250,
      strengthDaysThisWeek: 2,
      weeksActiveInWindow: 4,
      feel: {
        soreness: 2,
        painIntensity: 0,
        morningStiffness: 2,
        fatigue: 3,
        confidence: 7,
      },
    },
    expected: null, // ⟨advisor⟩ TODO
  },
  {
    name: "high-soreness-week",
    description: "Normal load but a rough week: high soreness and fatigue.",
    input: {
      acuteLoad: 330,
      chronicLoad: 300,
      strengthDaysThisWeek: 1,
      weeksActiveInWindow: 4,
      feel: {
        soreness: 8,
        painIntensity: 2,
        morningStiffness: 5,
        fatigue: 8,
        confidence: 3,
      },
    },
    expected: null, // ⟨advisor⟩ TODO
  },
  {
    name: "achilles-stiffness-3-of-10-settling",
    description:
      "Mild Achilles morning stiffness ~3/10 that is settling; monitor-and-continue territory.",
    input: {
      acuteLoad: 300,
      chronicLoad: 300,
      strengthDaysThisWeek: 2,
      weeksActiveInWindow: 4,
      feel: {
        soreness: 3,
        painIntensity: 3,
        morningStiffness: 3,
        fatigue: 3,
        confidence: 6,
      },
    },
    expected: null, // ⟨advisor⟩ TODO
  },
];
