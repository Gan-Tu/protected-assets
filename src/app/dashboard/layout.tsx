import Link from "next/link";

import { LayoutGridIcon, LogOutIcon, PlusIcon, Settings2Icon } from "lucide-react";

import { signOutAction } from "@/app/auth/actions";
import { LogoMark } from "@/components/app/logo-mark";
import { requireOwner } from "@/lib/data";

export const dynamic = "force-dynamic";

const navLinkClass =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-white";
const ghostActionClass =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white/70";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutGridIcon },
  { href: "/dashboard/assets/new", label: "New asset", icon: PlusIcon },
  { href: "/dashboard/settings", label: "Settings", icon: Settings2Icon },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOwner();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f3f8fb_0%,#eef2f8_45%,#f7f8fb_100%)]">
      <div className="mx-auto flex max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <LogoMark />
          <div className="flex flex-wrap items-center gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
            <form action={signOutAction}>
              <button
                type="submit"
                className={ghostActionClass}
              >
                <LogOutIcon className="size-4" />
                Sign out
              </button>
            </form>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
