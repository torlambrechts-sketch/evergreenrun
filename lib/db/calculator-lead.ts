import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Store a public calculator lead (email + derived score). Runs as the anon/
 * authenticated caller; RLS allows insert-only, so this can never read other
 * leads back. No health data is stored — email + score only.
 */
export async function insertCalculatorLead(input: {
  email: string;
  score: number;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("calculator_lead")
    .insert({ email: input.email, score: input.score });
  if (error) throw error;
}
