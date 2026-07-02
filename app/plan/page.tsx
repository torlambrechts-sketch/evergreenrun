import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCurrentPlan } from "@/lib/db/plan";
import { generateThisWeeksPlan } from "./actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SESSION_LABEL: Record<string, string> = {
  easy: "Easy run",
  quality: "Quality session",
  long: "Long run",
  strength: "Strength",
  rest: "Rest",
  walk_run: "Walk-run",
};

function minutes(durationS: number | null): string {
  if (!durationS) return "";
  return `${Math.round(durationS / 60)} min`;
}

export default async function PlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const current = await getCurrentPlan();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 p-6">
      <PageHeader eyebrow="Training plan" title="This week" />

      {!current ? (
        <Card>
          <CardHeader>
            <CardTitle>Get this week&apos;s plan</CardTitle>
            <CardDescription>
              A gentle, durable week built from your recent running — easy days, one
              quality session, a capped long run, and two strength days. It adapts
              if you&apos;ve had a break.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={generateThisWeeksPlan}>
              <Button type="submit">Generate my week</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="capitalize">
                {(current.plan.program ?? "your").replace("_", "-")} week
              </CardTitle>
              <CardDescription>
                Built for you — not a test to pass. Move days around to fit your life.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2">
                {current.sessions.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-baseline justify-between gap-4 border-b py-2 last:border-b-0"
                  >
                    <span className="w-10 text-sm font-medium">
                      {s.day_of_week != null ? DAY_NAMES[s.day_of_week] : "—"}
                    </span>
                    <span className="flex-1 text-sm">
                      {SESSION_LABEL[s.session_type] ?? s.session_type}
                      {s.notes && (
                        <span className="block text-xs text-muted-foreground">
                          {s.notes}
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-mono text-muted-foreground">
                      {minutes(s.target_duration_s)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <form action={generateThisWeeksPlan}>
              <Button type="submit" variant="outline">
                Regenerate
              </Button>
            </form>
            <span className="text-xs text-muted-foreground">
              Rules {current.plan.rule_set_version}
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
