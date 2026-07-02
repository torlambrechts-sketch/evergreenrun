"use server";

import { revalidatePath } from "next/cache";

import { updateMyRunnerProfile } from "@/lib/db/runner-profile";
import { ProfileSchema } from "@/lib/validation/profile";

export type ProfileState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "error"; message: string };

export async function saveProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const parsed = ProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    ageBand: formData.get("ageBand"),
    experienceLevel: formData.get("experienceLevel"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Please check the form and try again." };
  }

  try {
    await updateMyRunnerProfile({
      displayName: parsed.data.displayName,
      ageBand: parsed.data.ageBand,
      experienceLevel: parsed.data.experienceLevel,
    });
    revalidatePath("/profile");
    revalidatePath("/plan");
    return { status: "saved" };
  } catch {
    return { status: "error", message: "Could not save that — please try again." };
  }
}
