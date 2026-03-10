"use client";

import Link from "next/link";
import { useActionState } from "react";

import { ArrowRightIcon, LockKeyholeIcon } from "lucide-react";

import { SubmitButton } from "@/components/app/submit-button";
import type { AuthActionState } from "@/app/auth/actions";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OAuthButtons } from "@/components/forms/oauth-buttons";
import { cn } from "@/lib/utils";

const initialState: AuthActionState = {};

export function AuthForm({
  title,
  description,
  action,
  mode,
}: {
  title: string;
  description: string;
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  mode: "sign-in" | "sign-up";
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <Card className="border-white/60 bg-white/88 py-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-md">
      <CardHeader>
        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
          <LockKeyholeIcon className="size-3.5" />
          Owner access
        </div>
        <CardTitle className="text-2xl tracking-tight text-slate-950">{title}</CardTitle>
        <CardDescription className="max-w-md text-sm leading-6 text-slate-600">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <OAuthButtons />
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          or
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="owner@company.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="At least 8 characters" required />
          </div>
          {state.error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {state.success}
            </p>
          ) : null}
          <SubmitButton className="w-full justify-center gap-2" pendingLabel="Working...">
            {mode === "sign-in" ? "Open dashboard" : "Create account"}
            <ArrowRightIcon className="size-4" />
          </SubmitButton>
        </form>
        <Link
          href={mode === "sign-in" ? "/auth/sign-up" : "/auth/sign-in"}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "w-full cursor-pointer justify-center",
          )}
        >
          {mode === "sign-in"
            ? "Need an owner account? Sign up"
            : "Already have an account? Sign in"}
        </Link>
      </CardContent>
    </Card>
  );
}
