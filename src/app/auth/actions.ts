"use server";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getErrorMessage, getRequestBaseUrl } from "@/lib/utils";

export type AuthActionState = {
  error?: string;
  success?: string;
};

export async function signInAction(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const supabase = await createServerSupabaseClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: getErrorMessage(error, "Unable to sign in.") };
  }

  redirect("/dashboard");
}

export async function signUpAction(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const supabase = await createServerSupabaseClient();
  const baseUrl = await getRequestBaseUrl();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${baseUrl}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return { error: getErrorMessage(error, "Unable to sign up.") };
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    success:
      "Account created. Check your email if confirmation is enabled, then continue to the dashboard.",
  };
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}
