import Link from "next/link";
import { FileQuestionIcon } from "lucide-react";

import { LogoMark } from "@/components/app/logo-mark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6 sm:pt-6">
        <LogoMark />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pt-12 pb-24 sm:px-6">
        <div className="flex max-w-md flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-card shadow-xs">
            <FileQuestionIcon aria-hidden className="size-5 text-muted-foreground" />
          </span>
          <p className="mt-6 text-sm font-medium text-primary tabular">404</p>
          <h1 className="mt-2 text-3xl leading-tight font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
            Page not found
          </h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground">
            This page doesn’t exist, or the protected asset it pointed to was removed
            by its owner. If someone shared this link with you, ask them for a new one.
          </p>
          <Link href="/" className={cn(buttonVariants({ size: "lg" }), "mt-8")}>
            Go home
          </Link>
        </div>
      </main>
    </div>
  );
}
