import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ImportRunPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Import a run</CardTitle>
          <CardDescription>
            Upload a GPX or FIT file from your watch. We&apos;ll read distance and
            time from it. Max 5 MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Native multipart POST to a Route Handler — no client JS needed. */}
          <form
            action="/api/runs/import"
            method="post"
            encType="multipart/form-data"
            className="grid gap-4"
          >
            <input
              type="file"
              name="file"
              accept=".gpx,.fit"
              required
              className="text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm"
            />
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              GPX files are read fully. FIT files are stored safely and will be
              processed soon.
            </p>
            <div className="flex items-center gap-3">
              <Button type="submit">Import file</Button>
              <Link href="/runs" className="text-sm text-muted-foreground underline">
                Cancel
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
