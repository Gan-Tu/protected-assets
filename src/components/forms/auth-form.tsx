"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LockKeyholeIcon, ChevronRightIcon } from "lucide-react";

import { SubmitButton } from "@/components/app/submit-button";
import type { AuthActionState } from "@/app/auth/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <Card className="border-zinc-200 shadow-xl max-w-md w-full mx-auto overflow-hidden">
      <CardHeader className="space-y-4 pt-8 pb-6 bg-zinc-50/50 border-b border-zinc-100">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="size-10 flex items-center justify-center rounded-lg bg-white border border-zinc-200 shadow-sm text-zinc-900">
            <LockKeyholeIcon className="size-5" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900">{title}</CardTitle>
          <CardDescription className="text-sm text-zinc-500 max-w-[280px]">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-8">
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-zinc-700 text-xs font-bold uppercase tracking-wider">Email</Label>
            <Input id="email" name="email" type="email" placeholder="name@company.com" className="bg-zinc-50/30" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" title="At least 8 characters" className="text-zinc-700 text-xs font-bold uppercase tracking-wider">Password</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" className="bg-zinc-50/30" required />
          </div>

          {state.error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-100 text-sm text-red-600">
              {state.error}
            </div>
          )}

          {state.success && (
            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-100 text-sm text-emerald-600">
              {state.success}
            </div>
          )}

          <SubmitButton className="w-full h-11 font-bold shadow-sm" pendingLabel="Processing...">
            {mode === "sign-in" ? "Sign In" : "Create Account"}
            <ChevronRightIcon className="size-4 ml-2" />
          </SubmitButton>
        </form>

        <div className="text-center">
          <Link
            href={mode === "sign-in" ? "/auth/sign-up" : "/auth/sign-in"}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors underline underline-offset-4"
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
