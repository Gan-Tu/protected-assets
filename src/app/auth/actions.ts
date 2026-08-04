"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { errorState, successState, type ActionState } from "@/lib/action-state";
import {
  isNextControlFlowError,
  toFieldErrors,
  toUserMessage,
} from "@/lib/errors";
import {
  consumeMemoryQuota,
  describeRetryAfter,
  getClientIp,
} from "@/lib/rate-limit";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { credentialsSchema, parseOrThrow, readString } from "@/lib/validation";
import { getBaseUrl } from "@/lib/utils";

export type AuthActionState = ActionState;

/**
 * Supabase applies its own auth throttling; this is a cheap in-process guard so
 * a burst never reaches it in the first place.
 */
async function guardAuthAttempt(scope: string) {
  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);
  const result = consumeMemoryQuota(`${scope}:${ip}`, {
    limit: 20,
    windowSeconds: 15 * 60,
  });

  if (!result.ok) {
    throw new Error(
      `Too many attempts. Try again ${describeRetryAfter(result.retryAfterSeconds)}.`,
    );
  }
}

export async function signInAction(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    await guardAuthAttempt("sign-in");

    const credentials = parseOrThrow(credentialsSchema, {
      email: readString(formData, "email").trim(),
      password: readString(formData, "password"),
    });

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword(credentials);

    // Supabase's own message is safe and useful here ("Invalid login
    // credentials"), and it never distinguishes unknown email from wrong
    // password, so it cannot be used to enumerate accounts.
    if (error) {
      return errorState(error.message || "Unable to sign in.");
    }
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return errorState(
      toUserMessage(error, "Unable to sign in.", "auth.sign-in"),
      toFieldErrors(error),
    );
  }

  redirect("/dashboard");
}

export async function signUpAction(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  let hasSession = false;

  try {
    await guardAuthAttempt("sign-up");

    const credentials = parseOrThrow(credentialsSchema, {
      email: readString(formData, "email").trim(),
      password: readString(formData, "password"),
    });

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      ...credentials,
      options: {
        emailRedirectTo: `${getBaseUrl()}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      return errorState(error.message || "Unable to sign up.");
    }

    hasSession = Boolean(data.session);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return errorState(
      toUserMessage(error, "Unable to sign up.", "auth.sign-up"),
      toFieldErrors(error),
    );
  }

  if (hasSession) {
    redirect("/dashboard");
  }

  return successState(
    "Account created. Check your email if confirmation is enabled, then continue to the dashboard.",
  );
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}
