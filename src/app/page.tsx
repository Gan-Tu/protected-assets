import Link from "next/link";
import { ArrowRightIcon, Clock3Icon, FolderLockIcon, SparklesIcon, ChevronRightIcon } from "lucide-react";

import { LogoMark } from "@/components/app/logo-mark";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasSessionCookie } from "@/lib/auth";

const primaryLinkClass =
  "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-zinc-900 px-5 py-2.5 text-center text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 sm:w-auto sm:whitespace-nowrap";

const features = [
  {
    title: "Request-gated assets",
    description: "Keep sensitive links and files locked behind a request flow.",
    icon: FolderLockIcon,
  },
  {
    title: "Timed auto-release",
    description: "Set a fallback window for automatic access release.",
    icon: Clock3Icon,
  },
  {
    title: "Email delivery",
    description: "Secure delivery of links and files directly to requesters.",
    icon: SparklesIcon,
  },
];

export default async function Home() {
  // Only picks a nav label, so a cookie check beats a network round-trip to
  // Supabase on every landing-page hit. The dashboard still does real auth.
  const user = await hasSessionCookie();

  return (
    <main className="relative min-h-screen bg-white text-zinc-950 selection:bg-zinc-100">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="relative mx-auto max-w-6xl px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <LogoMark />
          <nav className="grid w-full grid-cols-2 items-center gap-3 sm:flex sm:w-auto sm:gap-6">
            <Link
              href={user ? "/dashboard" : "/auth/sign-in"}
              className="inline-flex cursor-pointer items-center justify-center rounded-md px-3 py-2 text-center text-sm font-medium text-zinc-600 transition hover:text-zinc-950 sm:px-0 sm:py-0"
            >
              {user ? "Dashboard" : "Sign in"}
            </Link>
            <Link href={user ? "/dashboard/assets/new" : "/auth/sign-up"} className={primaryLinkClass}>
              {user ? "Create asset" : "Get Started"}
            </Link>
          </nav>
        </header>

        <section className="mt-24 mb-20 text-center">
          <Badge
            variant="outline"
            className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-emerald-700"
          >
            Introducing Auto-Release
          </Badge>
          <h1 className="mt-8 text-5xl font-bold tracking-tight text-zinc-950 sm:text-7xl">
            Control your assets, <br className="hidden sm:block" />
            <span className="text-zinc-500">release with confidence.</span>
          </h1>
          <p className="mt-8 mx-auto max-w-2xl text-lg text-zinc-600 leading-relaxed">
            Create protected links and document bundles. Collect context from requesters, 
            then approve manually or let a timed policy auto-release access for you.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href={user ? "/dashboard" : "/auth/sign-up"} className={primaryLinkClass}>
              {user ? "Go to Dashboard" : "Create account"}
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-3 mb-32">
          {features.map((feature) => (
            <Card key={feature.title} className="h-full border-zinc-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-zinc-50 text-zinc-900 border border-zinc-100">
                  <feature.icon className="size-5" />
                </div>
                <CardTitle className="text-base font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-zinc-600 leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mb-32">
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 sm:p-12">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
                  Built for modern workflows
                </h2>
                <p className="mt-4 text-zinc-600 leading-relaxed">
                  Stop sending raw links. Use our control plane to track who is accessing your sensitive materials and why. Perfect for investor rooms, document sharing, and private links.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    "Instant email notifications",
                    "Custom auto-release windows",
                    "Secure file storage via Supabase",
                    "Detailed requester insights",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm font-medium text-zinc-700">
                      <div className="flex size-5 items-center justify-center rounded-full bg-zinc-900 text-white">
                        <ChevronRightIcon className="size-3" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-1.5">
                      <div className="size-3 rounded-full bg-zinc-100"></div>
                      <div className="size-3 rounded-full bg-zinc-100"></div>
                      <div className="size-3 rounded-full bg-zinc-100"></div>
                    </div>
                    <Badge variant="secondary" className="rounded-md text-[10px] font-bold">LOCKED</Badge>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 w-3/4 rounded bg-zinc-100"></div>
                    <div className="h-4 w-1/2 rounded bg-zinc-100"></div>
                    <div className="pt-4">
                      <div className="h-10 w-full rounded-md bg-zinc-950"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-zinc-100 py-12 text-center">
          <p className="text-sm text-zinc-500">
            Powered by Protected Assets by Gan
          </p>
        </footer>
      </div>
    </main>
  );
}
