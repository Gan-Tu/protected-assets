import Link from "next/link";

import { ArrowRightIcon, Clock3Icon, FolderLockIcon, SparklesIcon } from "lucide-react";

import { AmbientOrbits } from "@/components/app/ambient-orbits";
import { LogoMark } from "@/components/app/logo-mark";
import { CopyLinkButton } from "@/components/app/copy-link-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLandingUser } from "@/lib/data";
import { getBaseUrl } from "@/lib/utils";

const primaryLinkClass =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800";
const secondaryLinkClass =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-white";

const features = [
  {
    title: "Request-gated assets",
    description:
      "Every share link starts locked, captures requester context, and keeps owners in control.",
    icon: FolderLockIcon,
  },
  {
    title: "Timed auto-release",
    description:
      "Set a fallback window so nothing gets stuck in limbo if the owner is unavailable.",
    icon: Clock3Icon,
  },
  {
    title: "Email-first delivery",
    description:
      "Approved links and signed file downloads are delivered through Resend-powered release emails.",
    icon: SparklesIcon,
  },
];

export default async function Home() {
  const user = await getLandingUser();
  const demoUrl = `${getBaseUrl()}/a/investor-room`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#dff4ff,transparent_30%),linear-gradient(180deg,#f7fbff_0%,#eef2f8_45%,#f7f8fb_100%)] text-slate-950">
      <AmbientOrbits />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <LogoMark />
          <div className="flex items-center gap-3">
            <Link
              href={user ? "/dashboard" : "/auth/sign-in"}
              className={secondaryLinkClass}
            >
              {user ? "Dashboard" : "Sign in"}
            </Link>
            <Link
              href={user ? "/dashboard/assets/new" : "/auth/sign-up"}
              className={primaryLinkClass}
            >
              {user ? "Create asset" : "Start free"}
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-14 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-10">
          <div className="max-w-2xl">
            <Badge className="rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-slate-600 shadow-sm">
              owner-controlled release
            </Badge>
            <h1 className="mt-6 text-5xl leading-[0.95] font-semibold tracking-tight text-slate-950 sm:text-6xl">
              Share sensitive assets without giving up the control plane.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Create protected links and document bundles, collect context from requesters,
              then approve manually or let a timed policy auto-release access for you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={user ? "/dashboard" : "/auth/sign-up"}
                className={primaryLinkClass}
              >
                {user ? "Open dashboard" : "Create owner account"}
                <ArrowRightIcon className="size-4" />
              </Link>
              <CopyLinkButton value={demoUrl} />
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="border-white/60 bg-white/76 py-5 shadow-[0_24px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm"
                >
                  <CardHeader>
                    <feature.icon className="size-5 text-slate-500" />
                    <CardTitle className="text-base text-slate-950">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-6 text-slate-600">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="relative">
            <Card className="border-white/60 bg-white/88 py-6 shadow-[0_40px_90px_rgba(15,23,42,0.1)] backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="rounded-full">
                    Example flow
                  </Badge>
                  <p className="font-mono text-xs uppercase tracking-[0.3em] text-slate-400">
                    protected /a/...
                  </p>
                </div>
                <CardTitle className="text-2xl tracking-tight text-slate-950">
                  Investor room
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-slate-600">
                  Locked share page. Requesters submit email + rationale. Auto-release in 2d 6h
                  if the owner stays silent.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    Request submitted
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    owner@example.com is notified instantly through email, with optional SMS.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    Release outcome
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    Approve manually to send the link now, or let the timer release signed
                    download URLs automatically.
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                  <p className="font-mono text-xs uppercase tracking-[0.35em] text-slate-400">
                    Share URL
                  </p>
                  <p className="mt-3 break-all text-sm leading-6 text-slate-200">{demoUrl}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
