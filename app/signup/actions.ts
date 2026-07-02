"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { SignupSchema } from "@/lib/validation/auth";

export type SignupState =
  | { status: "idle" }
  | { status: "confirm"; email: string }
  | { status: "error"; message: string };

export async function signUp(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const parsed = SignupSchema.safeParse({
    firstName: formData.get("firstName"),
    email: formData.get("email"),
    password: formData.get("password"),
    experienceLevel: formData.get("experienceLevel"),
    next: formData.get("next") || undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please check the form.",
    };
  }

  const { firstName, email, password, experienceLevel, next } = parsed.data;
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      // Read by the signup trigger to seed runner_profile.
      data: { first_name: firstName, experience_level: experienceLevel ?? "" },
    },
  });

  if (error) {
    const message = error.message.toLowerCase().includes("already")
      ? "That email already has an account — try logging in."
      : "Could not create your account. Please try again.";
    return { status: "error", message };
  }

  // If email confirmation is off, signUp returns a session — go straight in.
  if (data.session) {
    redirect(next && next.startsWith("/") ? next : "/dashboard");
  }

  // Otherwise the user must confirm via email.
  return { status: "confirm", email };
}
