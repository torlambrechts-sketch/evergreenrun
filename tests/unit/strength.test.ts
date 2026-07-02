import { describe, expect, it } from "vitest";

import { buildStrengthSession, type ExerciseLite } from "@/lib/engine/strength";

const ex = (over: Partial<ExerciseLite> & { id: string; slug: string; name: string }): ExerciseLite => ({
  block: "load",
  tempo: null,
  contraindication_flags: [],
  regression_of: null,
  instructions: null,
  ...over,
});

const seatedCalf = ex({ id: "1", slug: "seated-calf-raise", name: "Seated Calf Raise", block: "competence" });
const hsrCalf = ex({ id: "2", slug: "hsr-calf-raise", name: "HSR Calf Raise", tempo: "3-0-3", contraindication_flags: ["achilles"], regression_of: "1" });
const boxSquat = ex({ id: "3", slug: "box-squat", name: "Box Squat", block: "competence" });
const gobletNoReg = ex({ id: "4", slug: "goblet-squat", name: "Goblet Squat", contraindication_flags: ["knee"], regression_of: null });

const bySlug = new Map([seatedCalf, hsrCalf, boxSquat, gobletNoReg].map((e) => [e.slug, e]));
const byId = new Map([seatedCalf, hsrCalf, boxSquat, gobletNoReg].map((e) => [e.id, e]));

describe("buildStrengthSession", () => {
  it("keeps exercises when nothing is contraindicated", () => {
    const out = buildStrengthSession(["hsr-calf-raise"], bySlug, byId, []);
    expect(out).toHaveLength(1);
    expect(out[0].slug).toBe("hsr-calf-raise");
    expect(out[0].substituted).toBe(false);
    expect(out[0].tempo).toBe("3-0-3");
  });

  it("substitutes the regression when a flag is contraindicated", () => {
    const out = buildStrengthSession(["hsr-calf-raise"], bySlug, byId, ["achilles"]);
    expect(out[0].slug).toBe("seated-calf-raise"); // swapped, not skipped
    expect(out[0].substituted).toBe(true);
    expect(out[0].note).toMatch(/achilles/i);
  });

  it("keeps (never silently skips) a contraindicated exercise with no regression", () => {
    const out = buildStrengthSession(["goblet-squat"], bySlug, byId, ["knee"]);
    expect(out).toHaveLength(1);
    expect(out[0].slug).toBe("goblet-squat");
    expect(out[0].note).toMatch(/knee/i);
  });

  it("drops unknown slugs rather than guessing", () => {
    expect(buildStrengthSession(["does-not-exist"], bySlug, byId, [])).toHaveLength(0);
  });
});
