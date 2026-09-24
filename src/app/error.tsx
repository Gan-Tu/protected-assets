"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCwIcon, TriangleAlertIcon } from "lucide-react";

import { LogoMark } from "@/components/app/logo-mark";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6 sm:pt-6">
        <LogoMark />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pt-12 pb-24 sm:px-6">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-xl border border-[#f6d3cf] bg-danger-subtle text-danger shadow-xs">
            <TriangleAlertIcon aria-hidden className="size-5" />
          </span>
          <h1 className="mt-6 text-3xl leading-tight font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
            Something went wrong
          </h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground">
            The page failed to load. Trying again usually fixes it.
          </p>
          <div className="mt-8 grid w-full gap-3 sm:flex sm:w-auto sm:justify-center">
            <Button type="button" size="lg" onClick={reset}>
              <RotateCwIcon aria-hidden />
              Try again
            </Button>
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Go to dashboard
            </Link>
          </div>
          {error.digest ? (
            <p className="mt-8 font-mono text-xs text-muted-foreground">
              Reference: <span className="select-all">{error.digest}</span>
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
