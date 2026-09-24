import Link from "next/link";

import { LogoMark } from "@/components/app/logo-mark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Where the marketing chrome points. `signedIn` comes from a cheap cookie
 * check, so a stale cookie only means the link bounces off the dashboard's
 * real auth check.
 */
export function getMarketingLinks(signedIn: boolean) {
  return signedIn
    ? {
        secondary: { href: "/dashboard", label: "Dashboard" },
        primary: { href: "/dashboard/assets/new", label: "New asset" },
      }
    : {
        secondary: { href: "/auth/sign-in", label: "Sign in" },
        primary: { href: "/auth/sign-up", label: "Get started" },
      };
}

/**
 * Sticky translucent bar. Text on glass stays ink / nav-foreground only: at
 * 80% white over dark content it still clears 6:1, secondary gray would not.
 */
export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const links = getMarketingLinks(signedIn);

  return (
    <header className="glass sticky top-0 z-40 border-b border-border">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:gap-3 sm:px-6">
        {/*
          Everything fits at 375px in both states. Below that the wordmark gives
          way before the nav wraps (the link keeps its aria-label); the wider
          signed-in labels need the extra room sooner.
        */}
        <LogoMark
          className={
            signedIn ? "max-[369px]:[&>span]:hidden" : "max-[349px]:[&>span]:hidden"
          }
        />
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Link
            href={links.secondary.href}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-9 px-2 text-nav-foreground hover:text-foreground sm:px-3",
            )}
          >
            {links.secondary.label}
          </Link>
          <Link
            href={links.primary.href}
            className={cn(buttonVariants({ size: "sm" }), "h-9 px-2.5 sm:px-3.5")}
          >
            {links.primary.label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
