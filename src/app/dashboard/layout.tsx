import { LogOutIcon } from "lucide-react";

import { signOutAction } from "@/app/auth/actions";
import { InitialsAvatar } from "@/components/app/avatar";
import { LogoMark } from "@/components/app/logo-mark";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Button } from "@/components/ui/button";
import { requireOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const owner = await requireOwner();
  const email = owner.email ?? "";

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Parked above the viewport until focused, then slides into view. */}
      <a
        href="#main"
        className="fixed top-2 left-2 z-50 -translate-y-24 rounded-lg bg-card px-3 py-2 text-sm font-medium text-foreground shadow-lg ring-1 ring-black/[0.06] outline-none transition-transform duration-150 ease-out-soft focus-visible:translate-y-0 focus-visible:ring-4 focus-visible:ring-primary/25"
      >
        Skip to content
      </a>

      <header className="glass sticky top-0 z-40 border-b border-border/70">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:gap-5 sm:px-6 lg:px-8">
          {/* Wordmark collapses to the glyph on phones to make room for the tabs. */}
          <LogoMark
            href="/dashboard"
            className="shrink-0 max-sm:[&>span]:hidden"
          />

          <DashboardNav className="shrink-0" />

          <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
            {email ? (
              <p className="flex min-w-0 items-center gap-2.5" title={email}>
                <InitialsAvatar email={email} size="sm" />
                <span className="sr-only">Signed in as </span>
                <span className="truncate text-[0.8125rem] font-medium text-nav-foreground max-md:sr-only">
                  {email}
                </span>
              </p>
            ) : null}

            <span
              aria-hidden
              className="mx-1 hidden h-5 w-px shrink-0 bg-border-strong sm:block"
            />

            <form action={signOutAction} className="shrink-0">
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-nav-foreground hover:bg-black/[0.04] hover:text-foreground max-sm:w-8 max-sm:px-0"
              >
                <LogOutIcon aria-hidden />
                <span className="sr-only sm:not-sr-only">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main
        id="main"
        className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
      >
        {children}
      </main>
    </div>
  );
}
