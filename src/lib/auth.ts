import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * `cache()` dedupes the Supabase auth round-trip across a single render, so a
 * layout and its page no longer pay for it twice.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

export async function requireOwner(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return user;
}

/**
 * Cheap, non-authoritative "is somebody signed in" check for public pages that
 * only use it to pick a nav label. Reads the session cookie instead of making a
 * network call to Supabase; a stale cookie just means the link bounces off the
 * dashboard's real auth check.
 */
export async function hasSessionCookie(): Promise<boolean> {
  const cookieStore = await cookies();

  return cookieStore
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith("sb-") &&
        cookie.name.includes("auth-token") &&
        Boolean(cookie.value),
    );
}
