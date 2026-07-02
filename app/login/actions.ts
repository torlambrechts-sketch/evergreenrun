"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { LoginSchema } from "@/lib/validation/auth";

export type LoginState = { status: "idle" } | { status: "error"; message: string };

export async function logIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please check your details.",
    };
  }

  const { email, password, next } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message =
      error.message === "Email not confirmed"
        ? "Please confirm your email first — check your inbox for the link."
        : "That email and password don't match. Try again.";
    return { status: "error", message };
  }

  redirect(next && next.startsWith("/") ? next : "/dashboard");
}
