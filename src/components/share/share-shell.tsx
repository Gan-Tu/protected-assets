import Link from "next/link";
import { LockIcon } from "lucide-react";

import { LogoGlyph, LogoMark } from "@/components/app/logo-mark";

/**
 * Chrome for the public share page: a quiet top bar, a centred column and a
 * small "Secured by" footer.
 *
 * The top wash is decoration only. It peaks at 7% primary at the top centre,
 * where no text sits. The strongest point any text overlaps is the "Secure
 * request" label on a phone (about 4%), where muted text still measures
 * 5.2:1, the same as on `bg-muted`; everywhere else it is fainter.
 */
export function ShareShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col bg-canvas">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgb(90_79_236/0.07),transparent_70%)]"
      />

      <header className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Same measure as the content column below, so the edges line up. */}
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between gap-4 lg:max-w-none">
          {/* Wordmark collapses to the glyph on phones, like the dashboard. */}
          <LogoMark className="max-sm:[&>span]:hidden" />
          <p className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-muted-foreground">
            <LockIcon className="size-3.5 text-subtle-foreground" aria-hidden />
            Secure request
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-16 sm:px-6 sm:pt-10 lg:px-8 lg:pt-14 lg:pb-20">
        {children}
      </main>

      <footer className="flex justify-center px-4 pb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[0.8125rem] text-muted-foreground outline-none transition-colors duration-150 ease-out-soft hover:text-foreground focus-visible:ring-4 focus-visible:ring-primary/25"
        >
          <LogoGlyph className="size-4" />
          Secured by Protected Assets
        </Link>
      </footer>
    </div>
  );
}
