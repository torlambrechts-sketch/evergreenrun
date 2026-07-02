"use client";

import Link from "next/link";
import { useActionState } from "react";

import { saveProfile, type ProfileState } from "./actions";
import { AGE_BANDS, EXPERIENCE_LEVELS } from "@/lib/validation/profile";
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

const initialState: ProfileState = { status: "idle" };

const EXPERIENCE_LABELS: Record<(typeof EXPERIENCE_LEVELS)[number], string> = {
  returning: "Returning after a break (start gently)",
  regular: "Running regularly",
  experienced: "Experienced runner",
};

const selectClass =
  "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3";

export function ProfileForm({
  defaults,
}: {
  defaults: { displayName: string; ageBand: string; experienceLevel: string };
}) {
  const [state, formAction, pending] = useActionState(saveProfile, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your profile</CardTitle>
        <CardDescription>
          This shapes your plan — returning runners start with a gentler walk-run
          on-ramp. You can change it any time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="displayName">First name (optional)</Label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              maxLength={60}
              defaultValue={defaults.displayName}
              placeholder="What should we call you?"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="experienceLevel">Where are you right now?</Label>
            <select
              id="experienceLevel"
              name="experienceLevel"
              defaultValue={defaults.experienceLevel}
              className={selectClass}
            >
              <option value="">Prefer not to say</option>
              {EXPERIENCE_LEVELS.map((v) => (
                <option key={v} value={v}>
                  {EXPERIENCE_LABELS[v]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ageBand">Age band (optional)</Label>
            <select
              id="ageBand"
              name="ageBand"
              defaultValue={defaults.ageBand}
              className={selectClass}
            >
              <option value="">Prefer not to say</option>
              {AGE_BANDS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {state.status === "saved" && (
            <p className="text-sm text-muted-foreground" role="status">
              Saved. Your next plan will reflect this.
            </p>
          )}
          {state.status === "error" && (
            <p className="text-sm text-destructive" role="alert">
              {state.message}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
            <Link href="/dashboard" className="text-sm text-muted-foreground underline">
              Back
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
