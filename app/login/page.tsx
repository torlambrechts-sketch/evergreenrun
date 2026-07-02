"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";

import { sendMagicLink, type LoginState } from "./actions";
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

const initialState: LoginState = { status: "idle" };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [state, formAction, pending] = useActionState(
    sendMagicLink,
    initialState,
  );

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in to Evergreen Run</CardTitle>
          <CardDescription>
            We&apos;ll email you a one-tap link — no password to remember.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.status === "sent" ? (
            <p className="text-sm text-muted-foreground" role="status">
              Check <span className="font-medium">{state.email}</span> for your
              sign-in link. You can close this tab.
            </p>
          ) : (
            <form action={formAction} className="grid gap-4">
              <input type="hidden" name="next" value={next} />
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </div>
              {state.status === "error" && (
                <p className="text-sm text-destructive" role="alert">
                  {state.message}
                </p>
              )}
              <Button type="submit" disabled={pending}>
                {pending ? "Sending…" : "Email me a link"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
