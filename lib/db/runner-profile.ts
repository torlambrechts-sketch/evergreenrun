import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database.types";

export type RunnerProfile = Tables<"runner_profile">;

/**
 * Returns the signed-in user's runner profile, or null if none exists.
 *
 * RLS guarantees this can only ever return the caller's own row — the
 * `user_id = auth.uid()` policy is enforced in Postgres, not here.
 */
export async function getMyRunnerProfile(): Promise<RunnerProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("runner_profile")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}
