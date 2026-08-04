"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[protected-assets] render error", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangleIcon className="size-6" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            Something went wrong
          </h1>
          <p className="text-sm leading-relaxed text-zinc-600">
            The page failed to load. Trying again usually fixes it.
          </p>
          {error.digest ? (
            <p className="font-mono text-xs text-zinc-400">
              Reference: {error.digest}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <Button type="button" onClick={reset} className="cursor-pointer">
            Try again
          </Button>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            render={<Link href="/dashboard" />}
          >
            Back to dashboard
          </Button>
        </div>
      </div>
    </main>
  );
}
