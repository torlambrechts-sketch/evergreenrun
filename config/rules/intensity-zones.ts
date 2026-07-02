import type { IntensityZone } from "./schema";

/**
 * Intensity zones: recovery / easy / steady / hard, each defined by a talk-test
 * cue and an RPE band.
 *
 * ⟨advisor⟩ The RPE bands below are UNSIGNED DRAFT placeholders so the config is
 * loadable and typed. They are NOT clinically signed. The advisor owns these
 * numbers; when they are signed, set advisorSigned: true here and update the
 * golden tests (Session 4). Do not treat a drafted band as authoritative.
 */
export const intensityZones: IntensityZone[] = [
  {
    key: "recovery",
    label: "Recovery",
    rpeMin: 1, // ⟨advisor⟩ draft
    rpeMax: 2, // ⟨advisor⟩ draft
    talkTest: "Could sing; feels almost too easy.",
    description: "Very easy effort for active recovery.",
    advisorSigned: false,
  },
  {
    key: "easy",
    label: "Easy",
    rpeMin: 3, // ⟨advisor⟩ draft
    rpeMax: 4, // ⟨advisor⟩ draft
    talkTest: "Full sentences without effort.",
    description: "Conversational base running — the bulk of the week.",
    advisorSigned: false,
  },
  {
    key: "steady",
    label: "Steady",
    rpeMin: 5, // ⟨advisor⟩ draft
    rpeMax: 6, // ⟨advisor⟩ draft
    talkTest: "Short phrases, not full sentences.",
    description: "Comfortably hard, controlled.",
    advisorSigned: false,
  },
  {
    key: "hard",
    label: "Hard",
    rpeMin: 7, // ⟨advisor⟩ draft
    rpeMax: 9, // ⟨advisor⟩ draft
    talkTest: "Single words only.",
    description: "Quality effort — used sparingly, well spaced.",
    advisorSigned: false,
  },
];
