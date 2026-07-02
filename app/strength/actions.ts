"use server";

import { redirect } from "next/navigation";

import { logStrengthSession } from "@/lib/db/strength";

export async function logStrength(formData: FormData): Promise<void> {
  const type = formData.get("sessionType");
  if (type !== "A" && type !== "B") redirect("/strength");
  await logStrengthSession(type);
  redirect(`/strength?logged=${type}`);
}
