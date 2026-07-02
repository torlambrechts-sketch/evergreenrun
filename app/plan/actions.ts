"use server";

import { revalidatePath } from "next/cache";

import { generateAndSavePlan } from "@/lib/db/plan";

/** Generate + persist this week's plan for the signed-in user. */
export async function generateThisWeeksPlan(): Promise<void> {
  await generateAndSavePlan();
  revalidatePath("/plan");
}
