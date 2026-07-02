import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getMyRunnerProfile } from "@/lib/db/runner-profile";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards this, but never render a protected page without a user.
  if (!user) redirect("/login");

  // Proves the typed /lib/db access + RLS path works end-to-end.
  const profile = await getMyRunnerProfile();

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>You&apos;re in</CardTitle>
          <CardDescription>
            Signed in as{" "}
            <span className="font-medium text-foreground">{user.email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            {profile
              ? "Your runner profile is ready. Next up: logging a run."
              : "We'll set up your runner profile next."}
          </p>
          <Link href="/coach" className={buttonVariants()}>
            My weekly note
          </Link>
          <Link href="/plan" className={buttonVariants({ variant: "outline" })}>
            This week&apos;s plan
          </Link>
          <Link href="/strength" className={buttonVariants({ variant: "outline" })}>
            Strength
          </Link>
          <Link href="/feel" className={buttonVariants({ variant: "outline" })}>
            How am I feeling?
          </Link>
          <Link href="/score" className={buttonVariants({ variant: "outline" })}>
            My Durability Score
          </Link>
          <Link href="/runs" className={buttonVariants({ variant: "outline" })}>
            My runs
          </Link>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
