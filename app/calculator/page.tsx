"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { captureLead, type CaptureState } from "./actions";
import { CalculatorSchema } from "@/lib/validation/calculator";
import { runPublicCalculator } from "@/lib/engine/public-calculator";
import type { DurabilityIndexResult } from "@/lib/engine/durability-index";
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

const initialCapture: CaptureState = { status: "idle" };

const SUBSCORES: Array<{ key: string; label: string }> = [
  { key: "load", label: "Load" },
  { key: "strength", label: "Strength" },
  { key: "consistency", label: "Consistency" },
  { key: "readiness", label: "Readiness" },
];

function NumberField(props: {
  name: string;
  label: string;
  min: number;
  max: number;
  step?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={props.name}>{props.label}</Label>
      <Input
        id={props.name}
        name={props.name}
        type="number"
        min={props.min}
        max={props.max}
        step={props.step ?? "1"}
        placeholder={props.placeholder}
        inputMode="numeric"
        required
      />
      {props.hint && <p className="text-xs text-muted-foreground">{props.hint}</p>}
    </div>
  );
}

export default function CalculatorPage() {
  const [result, setResult] = useState<DurabilityIndexResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [capture, captureAction, capturing] = useActionState(
    captureLead,
    initialCapture,
  );

  function onQuizSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = CalculatorSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      setFormError("Please fill in every field with a valid number.");
      return;
    }
    setFormError(null);
    setResult(runPublicCalculator(parsed.data));
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 p-6">
      <div className="mb-6">
        <div className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.14em] text-primary">
          Free check-in
        </div>
        <h1 className="mt-2 text-[1.7rem] font-extrabold leading-none tracking-tight">
          Your Durability Score
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A 2-minute check-in — no account needed. This is a baseline, not a
          grade: a starting point, not a verdict.
        </p>
      </div>

      {!result ? (
        <Card>
          <CardHeader>
            <CardTitle>Tell us about your running</CardTitle>
            <CardDescription>Rough numbers are fine.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onQuizSubmit} className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <NumberField name="runsThisWeek" label="Runs this week" min={0} max={21} placeholder="3" />
                <NumberField name="strengthDays" label="Strength days / week" min={0} max={7} placeholder="2" />
                <NumberField name="minutesThisWeek" label="Minutes run this week" min={0} max={3000} placeholder="120" />
                <NumberField name="typicalMinutesPerWeek" label="Typical minutes / week" min={0} max={3000} placeholder="150" hint="Over the last month" />
                <NumberField name="weeksActive" label="Active weeks (of last 4)" min={0} max={4} placeholder="4" />
              </div>
              <p className="text-sm font-medium">How does your body feel? (0 = great, 10 = rough)</p>
              <div className="grid grid-cols-2 gap-4">
                <NumberField name="soreness" label="Soreness" min={0} max={10} placeholder="2" />
                <NumberField name="pain" label="Pain" min={0} max={10} placeholder="0" />
                <NumberField name="morningStiffness" label="Morning stiffness" min={0} max={10} placeholder="1" />
                <NumberField name="fatigue" label="Fatigue" min={0} max={10} placeholder="3" />
                <NumberField name="confidence" label="Confidence (0 = low, 10 = high)" min={0} max={10} placeholder="7" />
              </div>
              {formError && (
                <p className="text-sm text-destructive" role="alert">
                  {formError}
                </p>
              )}
              <Button type="submit">See my score</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-baseline gap-3">
                <span className="text-5xl font-semibold font-mono">{result.score}</span>
                <span className="text-sm font-normal text-muted-foreground">/ 100</span>
              </CardTitle>
              <CardDescription>
                A baseline to build on — not a grade. Nothing here to pass or fail.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {SUBSCORES.map(({ key, label }) => {
                const entry = result.breakdown[key as keyof typeof result.breakdown];
                return (
                  <div key={key} className="grid gap-1">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium">{label}</span>
                      <span className="font-mono text-muted-foreground">{entry.subScore}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(0, Math.min(100, entry.subScore))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Keep your baseline</CardTitle>
              <CardDescription>
                Create a free account to track this over time and get your weekly
                plan. Enter your email and we&apos;ll send a sign-in link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {capture.status === "captured" ? (
                <div className="grid gap-3" role="status">
                  <p className="text-sm text-muted-foreground">
                    Thanks — check your inbox to finish creating your account.
                  </p>
                  <Link href="/login" className="text-sm font-medium underline">
                    Or sign in now
                  </Link>
                </div>
              ) : (
                <form action={captureAction} className="grid gap-3">
                  <input type="hidden" name="score" value={result.score} />
                  <div className="grid gap-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                  </div>
                  {capture.status === "error" && (
                    <p className="text-sm text-destructive" role="alert">
                      {capture.message}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <Button type="submit" disabled={capturing}>
                      {capturing ? "Saving…" : "Email me my sign-in link"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setResult(null)}
                      className="text-sm text-muted-foreground underline"
                    >
                      Start over
                    </button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
