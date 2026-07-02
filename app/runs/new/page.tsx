"use client";

import Link from "next/link";
import { useActionState } from "react";

import { logRun, type LogRunState } from "../actions";
import { TALK_TEST_VALUES } from "@/lib/validation/run";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: LogRunState = { status: "idle" };
const today = new Date().toISOString().slice(0, 10);

const TALK_TEST_LABELS: Record<(typeof TALK_TEST_VALUES)[number], string> = {
  full_sentences: "Full sentences (easy)",
  phrases: "Short phrases (steady)",
  single_words: "Single words (hard)",
};

export default function NewRunPage() {
  const [state, formAction, pending] = useActionState(logRun, initialState);

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Log a run</CardTitle>
          <CardDescription>
            Takes about 30 seconds. Only distance and time are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.status === "created" ? (
            <div className="grid gap-4" role="status">
              <p className="text-sm text-muted-foreground">
                Nice one — that run is logged.
              </p>
              <Link href="/runs" className="text-sm font-medium underline">
                View my runs
              </Link>
            </div>
          ) : (
            <form action={formAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" defaultValue={today} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="distanceKm">Distance (km)</Label>
                  <Input
                    id="distanceKm"
                    name="distanceKm"
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    placeholder="5.0"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="durationMin">Duration (min)</Label>
                  <Input
                    id="durationMin"
                    name="durationMin"
                    type="number"
                    step="0.1"
                    min="0"
                    inputMode="decimal"
                    placeholder="30"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="rpe">Effort (RPE 1–10)</Label>
                  <Input id="rpe" name="rpe" type="number" min="1" max="10" placeholder="optional" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="avgHr">Avg HR</Label>
                  <Input id="avgHr" name="avgHr" type="number" min="30" max="250" placeholder="optional" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="talkTest">Talk test</Label>
                <select
                  id="talkTest"
                  name="talkTest"
                  defaultValue=""
                  className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
                >
                  <option value="">Optional</option>
                  {TALK_TEST_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {TALK_TEST_LABELS[v]}
                    </option>
                  ))}
                </select>
              </div>

              {state.status === "duplicate" && (
                <p className="text-sm text-muted-foreground" role="status">
                  Looks like that run is already logged — nothing to add.
                </p>
              )}
              {state.status === "error" && (
                <p className="text-sm text-destructive" role="alert">
                  {state.message}
                </p>
              )}

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Save run"}
                </Button>
                <Link href="/runs" className="text-sm text-muted-foreground underline">
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
