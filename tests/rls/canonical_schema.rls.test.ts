import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database.types";

/**
 * Session 2 — full canonical schema RLS. For every user-scoped table, user B
 * must read 0 of user A's rows and >=1 of its own. Shared reference tables
 * (rule_set, exercise) are readable but not writable by a signed-in user.
 *
 * Uses service_role only to seed/tear down; all assertions go through anon
 * clients scoped to each user's session. Skips loudly without the service key.
 * A no-secrets DB-level proof lives in supabase/tests/canonical_schema_rls.sql.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const canRun = Boolean(url && anonKey && serviceKey);
const describeIf = canRun ? describe : describe.skip;

if (!canRun) {
  console.warn(
    "[rls] Skipping canonical-schema RLS test: set SUPABASE_SERVICE_ROLE_KEY to run it.",
  );
}

/** User-scoped tables that must isolate by user_id. */
const OWNER_TABLES = [
  "consent_record",
  "safety_profile",
  "run_activity",
  "strength_session",
  "feel_log",
  "weekly_load",
  "plan",
  "planned_session",
  "red_flag_event",
  "durability_index_snapshot",
] as const;

describeIf("canonical schema RLS", () => {
  let admin: SupabaseClient<Database>;
  let clientB: SupabaseClient<Database>;
  let userAId = "";
  let userBId = "";
  const password = "test-password-Aa1!";
  const suffix = Math.floor(Date.now() / 1000);
  const emailA = `s2-a-${suffix}@evergreen.test`;
  const emailB = `s2-b-${suffix}@evergreen.test`;

  async function makeUser(email: string): Promise<string> {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error("createUser failed");
    return data.user.id;
  }

  /** Seed one row in every user-scoped table for a given user (as service role). */
  async function seedFor(uid: string) {
    await admin.from("consent_record").insert({ user_id: uid, consent_type: "terms", granted: true });
    await admin.from("safety_profile").insert({ user_id: uid });
    await admin.from("run_activity").insert({ user_id: uid, distance_m: 5000, duration_s: 1800 });
    await admin.from("strength_session").insert({ user_id: uid, session_type: "A" });
    await admin.from("feel_log").insert({ user_id: uid, soreness: 2, pain_intensity: 1 });
    await admin.from("weekly_load").insert({ user_id: uid, week_start: "2026-06-29" });
    const { data: plan, error: planErr } = await admin
      .from("plan")
      .insert({ user_id: uid, week_start: "2026-06-29", rule_set_version: "test" })
      .select("id")
      .single();
    if (planErr || !plan) throw planErr ?? new Error("seed plan failed");
    await admin.from("planned_session").insert({ plan_id: plan.id, user_id: uid, session_type: "easy" });
    await admin.from("red_flag_event").insert({ user_id: uid, severity: "monitor" });
    await admin.from("durability_index_snapshot").insert({ user_id: uid, rule_set_version: "test", score: 60 });
  }

  beforeAll(async () => {
    admin = createClient<Database>(url!, serviceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    userAId = await makeUser(emailA);
    userBId = await makeUser(emailB);
    await seedFor(userAId);
    await seedFor(userBId);
    await admin.from("rule_set").insert({ name: "durability_index", version: "test" });
    await admin.from("exercise").insert({ slug: `hsr-${suffix}`, name: "HSR Calf Raise" });

    clientB = createClient<Database>(url!, anonKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await clientB.auth.signInWithPassword({ email: emailB, password });
    if (error) throw error;
  });

  afterAll(async () => {
    if (userAId) await admin.auth.admin.deleteUser(userAId);
    if (userBId) await admin.auth.admin.deleteUser(userBId);
    await admin.from("rule_set").delete().eq("name", "durability_index").eq("version", "test");
    await admin.from("exercise").delete().eq("slug", `hsr-${suffix}`);
  });

  it.each(OWNER_TABLES)("isolates %s by owner", async (table) => {
    const ofA = await clientB.from(table).select("id").eq("user_id", userAId);
    expect(ofA.error).toBeNull();
    expect(ofA.data ?? []).toHaveLength(0); // B cannot see A's rows

    const ofB = await clientB.from(table).select("id").eq("user_id", userBId);
    expect(ofB.error).toBeNull();
    expect((ofB.data ?? []).length).toBeGreaterThanOrEqual(1); // B sees its own
  });

  it("lets a signed-in user read reference tables but not write them", async () => {
    const rs = await clientB.from("rule_set").select("id").limit(1);
    expect(rs.error).toBeNull();
    expect((rs.data ?? []).length).toBeGreaterThanOrEqual(1);

    const ex = await clientB.from("exercise").select("id").limit(1);
    expect(ex.error).toBeNull();
    expect((ex.data ?? []).length).toBeGreaterThanOrEqual(1);

    // Write must be blocked by RLS (no insert policy on reference tables).
    const write = await clientB.from("rule_set").insert({ name: "hack", version: "x" }).select();
    expect(write.error).not.toBeNull();
    expect(write.data ?? []).toHaveLength(0);
  });
});
