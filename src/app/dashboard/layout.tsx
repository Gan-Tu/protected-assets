import Link from "next/link";
import { LayoutGridIcon, LogOutIcon, Settings2Icon } from "lucide-react";

import { signOutAction } from "@/app/auth/actions";
import { LogoMark } from "@/components/app/logo-mark";
import { requireOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

const navLinkClass =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 sm:px-3 sm:py-2";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutGridIcon },
  { href: "/dashboard/settings", label: "Settings", icon: Settings2Icon },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOwner();

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-4 border-b border-zinc-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <LogoMark />
          <nav className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 sm:w-auto sm:gap-x-2">
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
            <div className="hidden h-4 w-px bg-zinc-200 mx-2 sm:block" />
            <form action={signOutAction}>
              <button type="submit" className={navLinkClass}>
                <LogOutIcon className="size-4" />
                Sign out
              </button>
            </form>
          </nav>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
