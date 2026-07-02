"use client";

import Link from "next/link";
import { useActionState } from "react";

import { logFeel, type FeelState } from "./actions";
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

const initialState: FeelState = { status: "idle" };

const RED_FLAGS: Array<{ name: string; label: string }> = [
  { name: "painAtRest", label: "Pain even at rest" },
  { name: "nightPain", label: "Pain that wakes me at night" },
  { name: "swelling", label: "Swelling" },
  { name: "numbnessOrTingling", label: "Numbness or tingling" },
  { name: "givingWay", label: "The joint gives way / feels unstable" },
];

function Rating({ name, label }: { name: string; label: string }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="number" min={0} max={10} placeholder="0–10" inputMode="numeric" />
    </div>
  );
}

/** Calm styling by severity — supportive, never alarmist. */
function assessmentTone(severity: string): string {
  switch (severity) {
    case "clinician":
      return "border-amber-300 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30";
    case "downshift":
      return "border-border bg-muted/50";
    default:
      return "border-border";
  }
}

export default function FeelPage() {
  const [state, formAction, pending] = useActionState(logFeel, initialState);

  if (state.status === "assessed") {
    const a = state.assessment;
    return (
      <main className="mx-auto w-full max-w-md flex-1 p-6">
        <Card className={assessmentTone(a.severity)}>
          <CardHeader>
            <CardTitle>{a.headline}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-sm text-muted-foreground">{a.detail}</p>
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-sm font-medium underline">
                Back to dashboard
              </Link>
              <Link href="/feel" className="text-sm text-muted-foreground underline">
                Log another
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 p-6">
      <Card>
        <CardHeader>
          <CardTitle>How are you feeling?</CardTitle>
          <CardDescription>
            A quick check-in. There are no wrong answers — this just helps keep
            your running sustainable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Rating name="soreness" label="Soreness (0–10)" />
              <Rating name="fatigue" label="Fatigue (0–10)" />
              <Rating name="morningStiffness" label="Morning stiffness (0–10)" />
              <Rating name="confidence" label="Confidence (0–10)" />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="painArea">Any pain? Where? (optional)</Label>
              <Input id="painArea" name="painArea" type="text" placeholder="e.g. left Achilles" maxLength={120} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Rating name="painIntensity" label="Pain intensity (0–10)" />
              <div className="grid gap-1.5">
                <Label htmlFor="settling">Is it settling?</Label>
                <select
                  id="settling"
                  name="settling"
                  defaultValue="unknown"
                  className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
                >
                  <option value="unknown">Not sure yet</option>
                  <option value="yes">Yes, easing off</option>
                  <option value="no">No, not settling</option>
                </select>
              </div>
            </div>

            <fieldset className="grid gap-2 rounded-lg border p-3">
              <legend className="px-1 text-sm font-medium">
                Any of these? (tick if yes)
              </legend>
              {RED_FLAGS.map((f) => (
                <label key={f.name} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name={f.name} className="size-4" />
                  {f.label}
                </label>
              ))}
            </fieldset>

            {state.status === "error" && (
              <p className="text-sm text-destructive" role="alert">
                {state.message}
              </p>
            )}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save check-in"}
              </Button>
              <Link href="/dashboard" className="text-sm text-muted-foreground underline">
                Cancel
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
