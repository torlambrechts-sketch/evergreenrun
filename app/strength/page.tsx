import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getStrengthSession, type StrengthSessionType } from "@/lib/db/strength";
import type { ResolvedExercise } from "@/lib/engine/strength";
import { logStrength } from "./actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function SessionCard({
  type,
  exercises,
}: {
  type: StrengthSessionType;
  exercises: ResolvedExercise[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Session {type}</CardTitle>
        <CardDescription>
          Two rounds, easy pace. Adjusted to what suits your body.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ul className="grid gap-3">
          {exercises.map((ex) => (
            <li key={ex.slug} className="border-b pb-3 last:border-b-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium">{ex.name}</span>
                {ex.tempo && (
                  <span className="text-xs font-mono text-muted-foreground">
                    tempo {ex.tempo}
                  </span>
                )}
              </div>
              {ex.instructions && (
                <p className="text-xs text-muted-foreground">{ex.instructions}</p>
              )}
              {ex.note && (
                <p className="mt-1 text-xs text-foreground/80">{ex.note}</p>
              )}
            </li>
          ))}
        </ul>
        <form action={logStrength}>
          <input type="hidden" name="sessionType" value={type} />
          <Button type="submit" variant="outline">
            Mark session {type} done
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default async function StrengthPage({
  searchParams,
}: {
  searchParams: Promise<{ logged?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [a, b] = await Promise.all([
    getStrengthSession("A"),
    getStrengthSession("B"),
  ]);
  const { logged } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-xl flex-1 p-6">
      <PageHeader eyebrow="Strength" title="Build durability" />

      {logged && (
        <p className="mb-4 text-sm text-muted-foreground" role="status">
          Session {logged} logged — that&apos;s the durability work that keeps you
          running. Nice.
        </p>
      )}

      <div className="grid gap-4">
        <SessionCard type="A" exercises={a} />
        <SessionCard type="B" exercises={b} />
      </div>
    </main>
  );
}
