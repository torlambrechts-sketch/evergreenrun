"use server";

import { revalidatePath } from "next/cache";

import { computeAndSaveSnapshot } from "@/lib/db/durability";

/** Compute the user's current Durability Index and persist a snapshot. */
export async function updateScore(): Promise<void> {
  await computeAndSaveSnapshot();
  revalidatePath("/score");
}
