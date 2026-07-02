"use client";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";

import { signUp, type SignupState } from "./actions";
import { BrandPanel } from "@/components/auth/brand-panel";
import { EXPERIENCE_LEVELS } from "@/lib/validation/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: SignupState = { status: "idle" };

const EXPERIENCE_LABELS: Record<(typeof EXPERIENCE_LEVELS)[number], string> = {
  returning: "Returning after a break",
  regular: "Running regularly",
  experienced: "Experienced runner",
};

const selectClass =
  "border-input bg-card focus-visible:border-ring focus-visible:ring-ring/50 h-11 rounded-xl border px-3 text-sm outline-none focus-visible:ring-[3px]";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupView />
    </Suspense>
  );
}

function SignupView() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <main className="flex flex-1">
      <BrandPanel
        heading="Start with a plan built for you."
        points={[
          "A plan that fits your life, not a race calendar",
          "Kind guidance — a baseline, never a grade",
          "Know when to push and when to ease back",
        ]}
      />

      <div className="flex flex-1 items-center justify-center bg-background p-6 sm:p-14">
        <div className="w-full max-w-sm">
          {state.status === "confirm" ? (
            <div className="grid gap-3" role="status">
              <h1 className="text-2xl font-extrabold tracking-tight">Check your email</h1>
              <p className="text-sm text-muted-foreground">
                We sent a confirmation link to{" "}
                <span className="font-semibold text-foreground">{state.email}</span>.
                Open it to finish creating your account, then log in.
              </p>
              <Link href="/login" className="text-sm font-bold text-primary">
                Go to log in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight">Create your account</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Already a member?{" "}
                <Link href="/login" className="font-bold text-primary">
                  Log in
                </Link>
              </p>

              <form action={formAction} className="mt-6 grid gap-4">
                <input type="hidden" name="next" value={next} />
                <div className="grid gap-1.5">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" name="firstName" type="text" autoComplete="given-name" maxLength={60} required />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" required minLength={8} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="experienceLevel">Where are you right now?</Label>
                  <select id="experienceLevel" name="experienceLevel" defaultValue="" className={selectClass}>
                    <option value="">Prefer not to say</option>
                    {EXPERIENCE_LEVELS.map((v) => (
                      <option key={v} value={v}>
                        {EXPERIENCE_LABELS[v]}
                      </option>
                    ))}
                  </select>
                </div>

                {state.status === "error" && (
                  <p className="text-sm text-destructive" role="alert">
                    {state.message}
                  </p>
                )}

                <Button type="submit" size="lg" disabled={pending} className="mt-1">
                  {pending ? "Creating…" : "Create account & build my plan"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  By continuing you agree to the Terms &amp; Privacy Policy.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
