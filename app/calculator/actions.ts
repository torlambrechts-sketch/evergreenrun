"use server";

import { insertCalculatorLead } from "@/lib/db/calculator-lead";
import { LeadCaptureSchema } from "@/lib/validation/calculator";

export type CaptureState =
  | { status: "idle" }
  | { status: "captured" }
  | { status: "error"; message: string };

/** Capture an email + score from the public calculator. No login required. */
export async function captureLead(
  _prev: CaptureState,
  formData: FormData,
): Promise<CaptureState> {
  const parsed = LeadCaptureSchema.safeParse({
    email: formData.get("email"),
    score: formData.get("score"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Enter a valid email address." };
  }

  try {
    await insertCalculatorLead(parsed.data);
    return { status: "captured" };
  } catch {
    return { status: "error", message: "Could not save that — please try again." };
  }
}
