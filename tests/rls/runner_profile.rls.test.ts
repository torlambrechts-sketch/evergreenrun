import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database.types";

/**
 * Negative-access RLS test (Golden rule 3): user B must never read user A's
 * runner_profile. Uses the service_role key only to seed/tear down test users;
 * the actual reads go through anon clients scoped by each user's own session,
 * exactly like the app.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY. Without it the suite skips with a clear
 * message rather than passing vacuously. A DB-level proof that always runs
 * lives in supabase/tests/runner_profile_rls.sql.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const canRun = Boolean(url && anonKey && serviceKey);
const describeIf = canRun ? describe : describe.skip;

if (!canRun) {
  // Surface why it skipped so a green run isn't mistaken for coverage.
  console.warn(
    "[rls] Skipping runner_profile RLS integration test: set SUPABASE_SERVICE_ROLE_KEY " +
      "(and NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) to run it.",
  );
}

describeIf("runner_profile RLS", () => {
  // Created in beforeAll so a skipped suite never touches the (absent) key.
  let admin: SupabaseClient<Database>;
  beforeAll(() => {
    admin = createClient<Database>(url!, serviceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  const suffix = Math.floor(Date.now() / 1000);
  const password = "test-password-Aa1!";
  const emailA = `rls-a-${suffix}@evergreen.test`;
  const emailB = `rls-b-${suffix}@evergreen.test`;
  const createdUserIds: string[] = [];

  async function makeUser(email: string): Promise<string> {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error("createUser failed");
    createdUserIds.push(data.user.id);
    return data.user.id;
  }

  async function signInClient(email: string): Promise<SupabaseClient<Database>> {
    const client = createClient<Database>(url!, anonKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return client;
  }

  afterAll(async () => {
    for (const id of createdUserIds) {
      await admin.auth.admin.deleteUser(id); // cascades to public.users -> runner_profile
    }
  });

  it("lets a user read their own profile but not another user's", async () => {
    const userAId = await makeUser(emailA);
    await makeUser(emailB);

    const clientB = await signInClient(emailB);

    // B reads its own profile: exactly one row.
    const own = await clientB
      .from("runner_profile")
      .select("*")
      .eq("user_id", (await clientB.auth.getUser()).data.user!.id);
    expect(own.error).toBeNull();
    expect(own.data).toHaveLength(1);

    // B tries to read A's profile: RLS returns zero rows (not an error).
    const other = await clientB
      .from("runner_profile")
      .select("*")
      .eq("user_id", userAId);
    expect(other.error).toBeNull();
    expect(other.data).toHaveLength(0);

    // B tries to write into A's row: blocked (0 rows affected / RLS error).
    const hijack = await clientB
      .from("runner_profile")
      .update({ display_name: "hijacked" })
      .eq("user_id", userAId)
      .select();
    expect(hijack.data ?? []).toHaveLength(0);
  });
});
