"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGridIcon, Settings2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutGridIcon,
    // Asset editors are opened from the overview, so it stays highlighted
    // there; a bare prefix match would also light it up on /settings.
    matches: (pathname: string) =>
      pathname === "/dashboard" || pathname.startsWith("/dashboard/assets"),
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings2Icon,
    matches: (pathname: string) => pathname.startsWith("/dashboard/settings"),
  },
] as const;

/**
 * Full-height tabs in the glass top bar: a hover pill on the label and a 2px
 * accent rule that sits on the bar's bottom hairline for the active section.
 * Text stays ink / nav-foreground because the bar is translucent.
 */
export function DashboardNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Dashboard"
      className={cn("flex h-full items-stretch", className)}
    >
      {items.map(({ href, label, icon: Icon, matches }) => {
        const active = matches(pathname);
        const exact = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            aria-current={exact ? "page" : active ? "true" : undefined}
            className={cn(
              "group/nav relative flex items-center px-0.5 outline-none",
              "after:pointer-events-none after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary after:content-['']",
              "after:opacity-0 after:transition-opacity after:duration-150 after:ease-out-soft",
              active && "after:opacity-100",
            )}
          >
            <span
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors duration-150 ease-out-soft",
                "group-focus-visible/nav:ring-4 group-focus-visible/nav:ring-primary/25",
                active
                  ? "text-foreground"
                  : "text-nav-foreground group-hover/nav:bg-black/[0.04] group-hover/nav:text-foreground",
              )}
            >
              <Icon aria-hidden className="hidden size-4 shrink-0 sm:block" />
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
