"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { MailCheckIcon } from "lucide-react";

import type { AuthActionState } from "@/app/auth/actions";
import { StatusMessage } from "@/components/app/status-message";
import { SubmitButton } from "@/components/app/submit-button";
import { PasswordInput } from "@/components/marketing/password-input";
import { buttonVariants } from "@/components/ui/button";
import { describedBy, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { IDLE_STATE } from "@/lib/action-state";
import { cn } from "@/lib/utils";

const PASSWORD_HINT = "At least 8 characters.";

const inlineLinkClass =
  "rounded-sm font-medium text-primary underline-offset-4 outline-none transition-colors duration-150 ease-out-soft hover:text-primary-hover hover:underline focus-visible:ring-4 focus-visible:ring-primary/25";

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
  const isSignIn = mode === "sign-in";

  // Sign-up only comes back with "success" when email confirmation is on;
  // otherwise the action redirects straight to the dashboard.
  if (!isSignIn && state.status === "success") {
    return <CheckInbox message={state.message} />;
  }

  const passwordHint = isSignIn ? undefined : PASSWORD_HINT;

  return (
    <div>
      <h1 className="text-2xl leading-tight font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground">
        {description}
      </p>

      <form action={formAction} className="mt-8 grid gap-5">
        {state.status === "error" && state.message ? (
          <StatusMessage status="error">{state.message}</StatusMessage>
        ) : null}
        {state.status === "success" && state.message ? (
          <StatusMessage status="success">{state.message}</StatusMessage>
        ) : null}

        <Field id="email" label="Email" error={fieldErrors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            className="h-11"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={describedBy("email", { error: fieldErrors.email })}
            required
          />
        </Field>

        <Field
          id="password"
          label="Password"
          hint={passwordHint}
          error={fieldErrors.password}
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete={isSignIn ? "current-password" : "new-password"}
            className="h-11"
            minLength={8}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={describedBy("password", {
              hint: passwordHint,
              error: fieldErrors.password,
            })}
            required
          />
        </Field>

        <SubmitButton
          size="lg"
          className="mt-1 w-full"
          pendingLabel={isSignIn ? "Signing in…" : "Creating account…"}
        >
          {isSignIn ? "Sign in" : "Create account"}
        </SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {isSignIn ? "New to Protected Assets?" : "Already have an account?"}{" "}
        <Link
          href={isSignIn ? "/auth/sign-up" : "/auth/sign-in"}
          className={inlineLinkClass}
        >
          {isSignIn ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}

/**
 * Replaces the form once the account exists but still needs confirming. Focus
 * moves to the heading so screen readers announce the new state and keyboard
 * users are not left on a button that no longer exists.
 */
function CheckInbox({ message }: { message?: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="animate-fade-up">
      <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-card shadow-xs">
        <MailCheckIcon aria-hidden className="size-5 text-primary" />
      </span>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-6 text-2xl leading-tight font-semibold tracking-tight text-foreground outline-none"
      >
        Check your inbox
      </h1>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground">
        {message ?? "We sent you a link to confirm your email address."}
      </p>
      <Link
        href="/auth/sign-in"
        className={cn(buttonVariants({ variant: "outline", size: "lg" }), "mt-8 w-full")}
      >
        Go to sign in
      </Link>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Can’t find the email? Check your spam folder.
      </p>
    </div>
  );
}
