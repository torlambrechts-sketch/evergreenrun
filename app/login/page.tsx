"use client";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";

import { logIn, type LoginState } from "./actions";
import { BrandPanel } from "@/components/auth/brand-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LoginState = { status: "idle" };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginView />
    </Suspense>
  );
}

function LoginView() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [state, formAction, pending] = useActionState(logIn, initialState);

  return (
    <main className="flex flex-1">
      <BrandPanel heading="Know how to keep running — for decades." />

      <div className="flex flex-1 items-center justify-center bg-background p-6 sm:p-14">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/signup" className="font-bold text-primary">
              Create an account
            </Link>
          </p>

          <form action={formAction} className="mt-7 grid gap-4">
            <input type="hidden" name="next" value={next} />
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
            </div>

            {state.status === "error" && (
              <p className="text-sm text-destructive" role="alert">
                {state.message}
              </p>
            )}

            <Button type="submit" size="lg" disabled={pending} className="mt-1">
              {pending ? "Logging in…" : "Log in"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
