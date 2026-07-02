"use server";

import { revalidatePath } from "next/cache";

import { logManualRun } from "@/lib/db/run-activity";
import { LogRunSchema } from "@/lib/validation/run";

export type LogRunState =
  | { status: "idle" }
  | { status: "created" }
  | { status: "duplicate" }
  | { status: "error"; message: string };

export async function logRun(
  _prev: LogRunState,
  formData: FormData,
): Promise<LogRunState> {
  const parsed = LogRunSchema.safeParse({
    date: formData.get("date"),
    distanceKm: formData.get("distanceKm"),
    durationMin: formData.get("durationMin"),
    rpe: formData.get("rpe"),
    talkTest: formData.get("talkTest"),
    avgHr: formData.get("avgHr"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please check the form.",
    };
  }

  const v = parsed.data;
  const result = await logManualRun({
    date: v.date,
    distanceM: Math.round(v.distanceKm * 1000),
    durationS: Math.round(v.durationMin * 60),
    rpe: v.rpe,
    talkTest: v.talkTest,
    avgHr: v.avgHr,
  });

  revalidatePath("/runs");

  return result.status === "duplicate"
    ? { status: "duplicate" }
    : { status: "created" };
}
