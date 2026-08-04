"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ChevronRightIcon, LockKeyholeIcon } from "lucide-react";

import type { AuthActionState } from "@/app/auth/actions";
import { StatusMessage } from "@/components/app/status-message";
import { SubmitButton } from "@/components/app/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IDLE_STATE } from "@/lib/action-state";

export function AuthForm({
  title,
  description,
  action,
  mode,
}: {
  title: string;
  description: string;
  action: (
    state: AuthActionState,
    formData: FormData,
  ) => Promise<AuthActionState>;
  mode: "sign-in" | "sign-up";
}) {
  const [state, formAction] = useActionState(action, IDLE_STATE);
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <Card className="mx-auto w-full max-w-md overflow-hidden border-zinc-200 shadow-xl">
      <CardHeader className="space-y-4 border-b border-zinc-100 bg-zinc-50/50 pb-6 pt-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-900 shadow-sm">
            <LockKeyholeIcon className="size-5" aria-hidden />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900">
            {title}
          </CardTitle>
          <CardDescription className="max-w-[280px] text-sm text-zinc-600">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-8">
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-bold uppercase tracking-wider text-zinc-700"
            >
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              className="bg-zinc-50/30"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              required
            />
            {fieldErrors.email ? (
              <p id="email-error" className="text-xs text-red-600">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-xs font-bold uppercase tracking-wider text-zinc-700"
            >
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={
                mode === "sign-in" ? "current-password" : "new-password"
              }
              placeholder="At least 8 characters"
              className="bg-zinc-50/30"
              minLength={8}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby="password-hint"
              required
            />
            <p id="password-hint" className="text-xs text-zinc-500">
              {fieldErrors.password ?? "At least 8 characters."}
            </p>
          </div>

          {state.status === "error" && state.message ? (
            <StatusMessage status="error">{state.message}</StatusMessage>
          ) : null}

          {state.status === "success" && state.message ? (
            <StatusMessage status="success">{state.message}</StatusMessage>
          ) : null}

          <SubmitButton
            className="h-11 w-full font-bold shadow-sm"
            pendingLabel="Processing..."
          >
            {mode === "sign-in" ? "Sign in" : "Create account"}
            <ChevronRightIcon className="ml-2 size-4" aria-hidden />
          </SubmitButton>
        </form>

        <div className="text-center">
          <Link
            href={mode === "sign-in" ? "/auth/sign-up" : "/auth/sign-in"}
            className="text-xs font-medium text-zinc-600 underline underline-offset-4 transition-colors hover:text-zinc-900"
          >
            {mode === "sign-in"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
