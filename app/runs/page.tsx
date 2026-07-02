import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listMyRuns } from "@/lib/db/run-activity";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatKm(distanceM: number | null): string {
  if (distanceM == null) return "—";
  return `${(distanceM / 1000).toFixed(1)} km`;
}

function formatDuration(durationS: number | null): string {
  if (durationS == null) return "—";
  const h = Math.floor(durationS / 3600);
  const m = Math.floor((durationS % 3600) / 60);
  const s = Math.round(durationS % 60);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

function formatPace(paceSecPerKm: number | null): string {
  if (paceSecPerKm == null) return "—";
  const m = Math.floor(paceSecPerKm / 60);
  const s = Math.round(paceSecPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")} /km`;
}

function formatDate(started: string | null): string {
  if (!started) return "—";
  return new Date(started).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default async function RunsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const runs = await listMyRuns();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">My runs</h1>
        <Link href="/runs/new" className={buttonVariants({ size: "sm" })}>
          Log a run
        </Link>
      </div>

      {runs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No runs yet</CardTitle>
            <CardDescription>
              When you log a run it&apos;ll show up here. No pressure — every run
              counts, and rest days count too.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/runs/new" className={buttonVariants()}>
              Log your first run
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3">
          {runs.map((run) => (
            <li key={run.id}>
              <Card>
                <CardContent className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
                  <span className="min-w-24 text-sm font-medium">
                    {formatDate(run.started_at)}
                  </span>
                  <span className="text-sm">{formatKm(run.distance_m)}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDuration(run.duration_s)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatPace(run.avg_pace_s_per_km)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {run.rpe != null ? `RPE ${run.rpe}` : "—"}
                  </span>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <Link href="/dashboard" className="text-sm text-muted-foreground underline">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
