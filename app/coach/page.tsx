import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCoachNote } from "@/lib/coach/gather";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CoachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const note = await getCoachNote();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 p-6">
      <PageHeader eyebrow="Weekly note" title="A note for your week" />

      {!note ? (
        <Card>
          <CardHeader>
            <CardTitle>Your note is nearly ready</CardTitle>
            <CardDescription>
              Log a run, calculate your score, or generate this week&apos;s plan,
              and your coach note will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/plan" className={buttonVariants({ size: "sm" })}>
              This week&apos;s plan
            </Link>
            <Link href="/score" className={buttonVariants({ size: "sm", variant: "outline" })}>
              My score
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>A note for your week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {note.text}
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
