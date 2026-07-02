import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/types/database.types";

/**
 * Supabase client for use in Client Components (browser).
 * Uses the publishable key only — never a secret key on the client.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
