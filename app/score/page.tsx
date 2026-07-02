import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getLatestSnapshot } from "@/lib/db/durability";
import { updateScore } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Shape of a sub-score entry inside the stored breakdown jsonb. */
interface BreakdownEntry {
  subScore: number;
  weight: number;
  weighted: number;
  rationale: string;
}

const SUBSCORE_ORDER: Array<{ key: string; label: string }> = [
  { key: "load", label: "Load" },
  { key: "strength", label: "Strength" },
  { key: "consistency", label: "Consistency" },
  { key: "readiness", label: "Readiness" },
];

export default async function ScorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const snapshot = await getLatestSnapshot();
  const breakdown = (snapshot?.breakdown ?? null) as Record<
    string,
    BreakdownEntry
  > | null;

  return (
    <main className="mx-auto w-full max-w-xl flex-1 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Durability Score
        </h1>
        <Link href="/dashboard" className="text-sm text-muted-foreground underline">
          Dashboard
        </Link>
      </div>

      {!snapshot ? (
        <Card>
          <CardHeader>
            <CardTitle>See your baseline</CardTitle>
            <CardDescription>
              Your Durability Score is a baseline, not a grade — a starting point
              that moves as your training does. Calculate it whenever you like.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateScore}>
              <Button type="submit">Calculate my score</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-baseline gap-3">
                <span className="text-5xl font-semibold tabular-nums">
                  {snapshot.score}
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  / 100
                </span>
              </CardTitle>
              <CardDescription>
                This is a baseline, not a grade. It moves as your training does —
                there&apos;s nothing to pass or fail here.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {SUBSCORE_ORDER.map(({ key, label }) => {
                const entry = breakdown?.[key];
                const value = entry?.subScore ?? 0;
                return (
                  <div key={key} className="grid gap-1">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium">{label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {value} · weight {entry?.weight ?? "—"}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                      />
                    </div>
                    {entry?.rationale && (
                      <p className="text-xs text-muted-foreground">
                        {entry.rationale}
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <form action={updateScore}>
              <Button type="submit" variant="outline">
                Update my score
              </Button>
            </form>
            <span className="text-xs text-muted-foreground">
              Rules {snapshot.rule_set_version}
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
