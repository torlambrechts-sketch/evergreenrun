import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getLatestSnapshot } from "@/lib/db/durability";
import { getCurrentPlan } from "@/lib/db/plan";
import { getCoachNote } from "@/lib/coach/gather";
import { isoWeekStart, isoWeekEnd } from "@/lib/util/week";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const weekStart = isoWeekStart(now);
  const weekEnd = isoWeekEnd(weekStart);
  const weekFrom = `${weekStart}T00:00:00.000Z`;
  const weekTo = `${weekEnd}T00:00:00.000Z`;

  const [profileRes, snapshot, current, note, weekly, runCount, strengthCount] =
    await Promise.all([
      supabase.from("runner_profile").select("display_name").eq("user_id", user.id).maybeSingle(),
      getLatestSnapshot(),
      getCurrentPlan(now),
      getCoachNote(now),
      supabase.from("weekly_load").select("total_distance_m, total_duration_s").eq("user_id", user.id).eq("week_start", weekStart).maybeSingle(),
      supabase.from("run_activity").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("started_at", weekFrom).lt("started_at", weekTo),
      supabase.from("strength_session").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("performed_at", weekFrom).lt("performed_at", weekTo),
    ]);

  const firstName = profileRes.data?.display_name ?? "";
  const greeting = firstName ? `Good morning, ${firstName}` : "Good morning";
  const dateLabel = now
    .toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })
    .toUpperCase();

  const targetMin = current
    ? Math.round(current.sessions.reduce((a, s) => a + (s.target_duration_s ?? 0), 0) / 60)
    : 0;
  const doneMin = Math.round((weekly.data?.total_duration_s ?? 0) / 60);
  const pct = targetMin > 0 ? Math.min(100, Math.round((doneMin / targetMin) * 100)) : 0;
  const doneKm = ((weekly.data?.total_distance_m ?? 0) / 1000).toFixed(1);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <div className="mb-6">
        <div className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.14em] text-primary">
          {dateLabel}
        </div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{greeting}</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="grid gap-5">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-2xl bg-foreground p-6 text-background">
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(14,122,107,.55), transparent 70%)" }}
            />
            <div className="relative font-mono text-[0.7rem] font-bold uppercase tracking-[0.12em] text-primary">
              This week
            </div>
            <div className="relative mt-3 text-2xl font-extrabold leading-tight text-balance">
              {current
                ? `Your ${(current.plan.program ?? "foundation").replace("_", "-")} week is ready`
                : "Let's set up your week"}
            </div>
            <p className="relative mt-1.5 max-w-md text-sm text-background/70">
              {current
                ? "Easy days, a capped long run, and your strength work — built from your recent running."
                : "Generate a gentle, durable plan built around where you are right now."}
            </p>
            <div className="relative mt-5 flex flex-wrap gap-3">
              <Link href="/plan" className="rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground">
                {current ? "See this week's plan" : "Build my week"}
              </Link>
              <Link href="/runs/new" className="rounded-xl border border-background/25 px-5 py-3 text-sm font-extrabold text-background">
                Log a run
              </Link>
            </div>
          </div>

          {/* Week progress */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-[0.95rem] font-extrabold">This week&rsquo;s running</span>
              <span className="font-mono text-xs text-muted-foreground">
                {doneMin} / {targetMin || "—"} min
              </span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-[#5ad1b0]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-3 font-mono text-xs text-muted-foreground">
              {doneKm} km logged · {runCount.count ?? 0} run{(runCount.count ?? 0) === 1 ? "" : "s"}
            </div>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-4">
            <StatTile label="Durability" value={snapshot ? String(snapshot.score) : "—"} href="/score" accent />
            <StatTile label="Runs · week" value={String(runCount.count ?? 0)} href="/runs" />
            <StatTile label="Strength · week" value={String(strengthCount.count ?? 0)} href="/strength" />
          </div>
        </div>

        {/* Rail */}
        <div className="grid content-start gap-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Weekly note
            </div>
            {note ? (
              <>
                <p className="mt-3 line-clamp-6 text-sm leading-relaxed text-foreground/90">
                  {note.text}
                </p>
                <Link href="/coach" className="mt-3 inline-block text-sm font-bold text-primary">
                  Read the full note
                </Link>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Log a run or generate a plan and your weekly note appears here.
              </p>
            )}
          </div>

          <Link href="/feel" className="rounded-2xl border border-border bg-accent p-5">
            <div className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-accent-foreground/70">
              Check in
            </div>
            <div className="mt-2 text-[0.95rem] font-extrabold text-accent-foreground">
              How are you feeling today?
            </div>
            <p className="mt-1 text-xs text-accent-foreground/80">
              A quick, kind check-in keeps your running sustainable.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}

function StatTile({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: string;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link href={href} className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <div className="text-[0.72rem] font-medium text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-2xl font-bold ${accent ? "text-primary" : ""}`}>
        {value}
      </div>
    </Link>
  );
}
