import Link from "next/link";
import {
  ArrowRightIcon,
  BellRingIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FoldersIcon,
  HistoryIcon,
  Link2OffIcon,
  LinkIcon,
  LockKeyholeIcon,
  MailCheckIcon,
  SendIcon,
  TimerIcon,
  type LucideIcon,
} from "lucide-react";

import { HeroVisual } from "@/components/marketing/hero-visual";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader, getMarketingLinks } from "@/components/marketing/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const container = "mx-auto w-full max-w-6xl px-4 sm:px-6";
const sectionSpacing = "py-14 sm:py-20 lg:py-28";

export function LandingPage({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader signedIn={signedIn} />
      <main className="flex-1">
        <Hero signedIn={signedIn} />
        <HowItWorks />
        <Features />
        <ClosingCta signedIn={signedIn} />
      </main>
      <SiteFooter signedIn={signedIn} />
    </div>
  );
}

function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    // `clip` (not `hidden`) trims the glow's overhang without creating a scroll container.
    <section className="relative overflow-x-clip pt-14 pb-6 sm:pt-20 sm:pb-10 lg:pt-24 lg:pb-12">
      <div className={container}>
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <Badge variant="accent" dot>
            Timed auto-release
          </Badge>
          <h1 className="mt-6 text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.04] font-semibold tracking-display text-balance text-foreground">
            Protected links and files, released on your terms.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-balance text-muted-foreground sm:text-xl">
            Put links and file bundles behind a request page. Approve each request
            yourself, or let a timer release access automatically.
          </p>
          <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href={signedIn ? "/dashboard" : "/auth/sign-up"}
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
            >
              {signedIn ? "Go to dashboard" : "Create a protected asset"}
              <ArrowRightIcon
                aria-hidden
                className="transition-transform duration-150 ease-out-soft group-hover/button:translate-x-0.5"
              />
            </Link>
            <Link
              href="#how-it-works"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
            >
              How it works
            </Link>
          </div>
        </div>

        <HeroVisual className="mt-14 sm:mt-20" />
      </div>
    </section>
  );
}

const steps: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: SendIcon,
    title: "Request",
    body: "Share your page. Visitors ask for access with their name, email and a short reason.",
  },
  {
    icon: TimerIcon,
    title: "Review or auto-release",
    body: "Approve or decline from your dashboard, or set a timer that releases access if you don’t respond in time.",
  },
  {
    icon: MailCheckIcon,
    title: "Delivered",
    body: "Access arrives by email, with small documents attached and larger files as expiring download links.",
  },
];

function HowItWorks() {
  return (
    // scroll-mt keeps the heading clear of the sticky header after the anchor jump.
    <section id="how-it-works" className={cn(sectionSpacing, "scroll-mt-14 sm:scroll-mt-16")}>
      <div className={container}>
        <SectionHeading
          eyebrow="How it works"
          title="From request to delivery in three steps"
          description="Requesters don’t need an account. They fill in a short form, and you decide what happens next."
        />
        <ol className="mt-12 grid gap-9 sm:mt-16 md:grid-cols-3 md:gap-8">
          {steps.map((step, index) => (
            <li key={step.title} className="flex items-start gap-4 md:block">
              <div className="flex shrink-0 items-center md:gap-4">
                <IconTile icon={step.icon} />
                {index < steps.length - 1 ? (
                  <span
                    aria-hidden
                    className="hidden h-px flex-1 bg-linear-to-r from-border-strong to-transparent md:block"
                  />
                ) : null}
              </div>
              <div className="min-w-0 md:mt-6">
                <p className="text-sm font-medium text-primary tabular">Step {index + 1}</p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const capabilities: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Link2OffIcon,
    title: "Revocable download links",
    body: "Larger files go out as expiring links. Clearing a request revokes links that were already emailed.",
  },
  {
    icon: FoldersIcon,
    title: "Collections and custom URLs",
    body: "Group related assets into collections and give each share page a memorable slug.",
  },
  {
    icon: BellRingIcon,
    title: "Email and SMS alerts",
    body: "Hear about new requests the moment they arrive, with the requester’s reason included.",
  },
  {
    icon: HistoryIcon,
    title: "Request history",
    body: "See who asked, why, and how each request was resolved, along with any note you sent.",
  },
];

function Features() {
  return (
    <section className={cn(sectionSpacing, "bg-canvas")}>
      <div className={container}>
        <SectionHeading
          eyebrow="Features"
          title="Everything stays in your hands"
          description="Requests, timers and delivery are handled for you, so you only step in where it matters."
        />

        <div className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            className="sm:col-span-2 md:col-span-1 lg:col-span-2"
            icon={LockKeyholeIcon}
            title="Request-gated links and files"
            body="Bundle links and documents behind one share page. Nothing is revealed until a request is approved or released."
            preview={<GatedPreview />}
          />
          <FeatureCard
            className="sm:col-span-2 md:col-span-1 lg:col-span-2"
            icon={TimerIcon}
            title="Timed auto-release"
            body="Choose a window of up to 7 days. Live countdowns show exactly when each pending request will release."
            preview={<TimerPreview />}
          />
          {capabilities.map((capability) => (
            <FeatureCard key={capability.title} size="sm" {...capability} />
          ))}
        </div>
      </div>
    </section>
  );
}

const ctaGlow = [
  "radial-gradient(55% 80% at 50% 0%, rgb(90 79 236 / 0.42), transparent 72%)",
  "radial-gradient(35% 60% at 88% 8%, rgb(56 189 248 / 0.16), transparent 72%)",
].join(", ");

/**
 * White on #1d1d1f is 16.8:1. The #c7c7cc body copy is 10:1 on the panel and
 * still 5:1 where both glows peak; the white/40 focus ring clears 3.7:1.
 */
function ClosingCta({ signedIn }: { signedIn: boolean }) {
  const links = getMarketingLinks(signedIn);

  return (
    <section className={sectionSpacing}>
      <div className={container}>
        <div className="relative overflow-hidden rounded-3xl bg-foreground px-6 py-14 text-center sm:px-12 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: ctaGlow }}
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl leading-tight font-semibold tracking-[-0.03em] text-balance text-white sm:text-[2.5rem] sm:leading-[1.1]">
              Share your next file on your terms
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-balance text-[#c7c7cc]">
              Set up a protected asset in minutes. Review requests yourself, or let
              the timer handle it.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={signedIn ? "/dashboard/assets/new" : "/auth/sign-up"}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "focus-visible:ring-white/40",
                )}
              >
                {signedIn ? "Create a protected asset" : "Get started"}
              </Link>
              <Link
                href={links.secondary.href}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "text-white hover:bg-white/10 focus-visible:ring-white/40",
                )}
              >
                {signedIn ? "Go to dashboard" : "Sign in"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-medium text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl leading-tight font-semibold tracking-[-0.03em] text-balance text-foreground sm:text-[2.5rem] sm:leading-[1.1]">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-lg leading-relaxed text-balance text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-xs">
      <Icon aria-hidden className="size-[1.125rem] text-primary" />
    </span>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  preview,
  size = "default",
  className,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  preview?: React.ReactNode;
  size?: "default" | "sm";
  className?: string;
}) {
  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-card shadow-sm",
        size === "default" ? "p-6 sm:p-8" : "p-6",
        className,
      )}
    >
      <IconTile icon={icon} />
      <h3
        className={cn(
          "mt-5 font-semibold tracking-tight text-foreground",
          size === "default" ? "text-lg" : "text-base",
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "mt-2 leading-relaxed text-pretty text-muted-foreground",
          size === "default" ? "text-[0.9375rem]" : "text-sm",
        )}
      >
        {body}
      </p>
      {/* Pinned to the bottom so side-by-side previews line up. */}
      {preview ? <div className="mt-auto pt-6">{preview}</div> : null}
    </article>
  );
}

/** Illustrations below are decorative: hidden from assistive tech, non-interactive. */
const previewWell =
  "pointer-events-none rounded-xl border border-border bg-canvas p-3 select-none sm:p-4";

function GatedPreview() {
  return (
    <div aria-hidden className={previewWell}>
      <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card py-1.5 pr-1.5 pl-3 shadow-xs">
        <LockKeyholeIcon className="size-3.5 shrink-0 text-subtle-foreground" />
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
          /a/series-a-data-room
        </span>
        <span className={cn(buttonVariants({ variant: "outline", size: "xs" }))}>Copy link</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip icon={FileTextIcon}>Pitch deck.pdf</Chip>
        <Chip icon={FileSpreadsheetIcon}>Financial model.xlsx</Chip>
        <Chip icon={LinkIcon}>Product demo</Chip>
      </div>
    </div>
  );
}

function Chip({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-xs font-medium text-foreground shadow-xs">
      <Icon className="size-3.5 text-subtle-foreground" />
      {children}
    </span>
  );
}

function TimerPreview() {
  return (
    <div aria-hidden className={previewWell}>
      <div className="rounded-lg border border-border bg-card p-3 shadow-xs">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-medium text-foreground">Requested 16h ago</span>
          <span className="text-muted-foreground">1-day window</span>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[68%] rounded-full bg-primary" />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <Badge variant="warning" dot>
            Releases in 7h 42m
          </Badge>
          <span className="text-xs text-muted-foreground">or approve any time</span>
        </div>
      </div>
    </div>
  );
}
