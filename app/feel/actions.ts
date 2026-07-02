"use server";

import { logFeelAndAssess } from "@/lib/db/feel-log";
import type { SafetyAssessment } from "@/lib/engine/safety";
import { FeelLogSchema } from "@/lib/validation/feel";

export type FeelState =
  | { status: "idle" }
  | { status: "assessed"; assessment: SafetyAssessment }
  | { status: "error"; message: string };

const checked = (fd: FormData, name: string) => fd.get(name) === "on";

export async function logFeel(
  _prev: FeelState,
  formData: FormData,
): Promise<FeelState> {
  const parsed = FeelLogSchema.safeParse({
    soreness: formData.get("soreness"),
    painArea: formData.get("painArea"),
    painIntensity: formData.get("painIntensity"),
    morningStiffness: formData.get("morningStiffness"),
    fatigue: formData.get("fatigue"),
    confidence: formData.get("confidence"),
    settling: formData.get("settling") ?? undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: "Please check the values and try again." };
  }

  const v = parsed.data;
  const settling =
    v.settling === "yes" ? true : v.settling === "no" ? false : null;

  try {
    const assessment = await logFeelAndAssess({
      soreness: v.soreness,
      painArea: v.painArea,
      painIntensity: v.painIntensity,
      morningStiffness: v.morningStiffness,
      fatigue: v.fatigue,
      confidence: v.confidence,
      settling,
      redFlags: {
        painAtRest: checked(formData, "painAtRest"),
        nightPain: checked(formData, "nightPain"),
        swelling: checked(formData, "swelling"),
        numbnessOrTingling: checked(formData, "numbnessOrTingling"),
        givingWay: checked(formData, "givingWay"),
      },
    });
    return { status: "assessed", assessment };
  } catch {
    return { status: "error", message: "Could not save that — please try again." };
  }
}
