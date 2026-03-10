"use client";

import { useTransition } from "react";

import { GithubIcon, LoaderCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        d="M21.8 12.23c0-.68-.06-1.34-.17-1.97H12v3.74h5.5a4.7 4.7 0 0 1-2.04 3.08v2.55h3.3c1.94-1.79 3.04-4.44 3.04-7.4Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.76 0 5.08-.91 6.78-2.47l-3.3-2.55c-.92.61-2.09.98-3.48.98-2.67 0-4.94-1.8-5.75-4.22H2.84v2.63A10.24 10.24 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.25 13.74A6.15 6.15 0 0 1 5.92 12c0-.61.11-1.2.33-1.74V7.63H2.84A10.24 10.24 0 0 0 1.76 12c0 1.64.39 3.18 1.08 4.37l3.41-2.63Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.04c1.5 0 2.85.52 3.91 1.53l2.94-2.94C17.07 2.98 14.75 2 12 2 7.96 2 4.47 4.3 2.84 7.63l3.41 2.63C7.06 7.84 9.33 6.04 12 6.04Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function OAuthButtons() {
  const [isPending, startTransition] = useTransition();

  const handleOAuth = (provider: "google" | "github") => {
    startTransition(async () => {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
    });
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Button
        type="button"
        variant="outline"
        className="cursor-pointer gap-2"
        onClick={() => handleOAuth("google")}
        disabled={isPending}
      >
        {isPending ? <LoaderCircleIcon className="size-4 animate-spin" /> : <GoogleGlyph />}
        Continue with Google
      </Button>
      <Button
        type="button"
        variant="outline"
        className="cursor-pointer gap-2"
        onClick={() => handleOAuth("github")}
        disabled={isPending}
      >
        {isPending ? (
          <LoaderCircleIcon className="size-4 animate-spin" />
        ) : (
          <GithubIcon className="size-4" />
        )}
        Continue with GitHub
      </Button>
    </div>
  );
}
