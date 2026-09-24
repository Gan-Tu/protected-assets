import {
  CheckIcon,
  Clock3Icon,
  FileTextIcon,
  LinkIcon,
  LockKeyholeIcon,
  type LucideIcon,
} from "lucide-react";

import { InitialsAvatar } from "@/components/app/avatar";
import { LogoGlyph } from "@/components/app/logo-mark";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Static pastel glow (no blur filter: plain gradients cost nothing to scroll).
 * It only ever sits behind opaque cards, so it never affects text contrast.
 * Each ellipse fades out fully (at 72% of its radius) inside the box, so no
 * gradient is ever cut off with a hard edge.
 */
const GLOW = [
  "radial-gradient(34% 48% at 28% 42%, rgb(90 79 236 / 0.17), rgb(90 79 236 / 0.06) 42%, transparent 72%)",
  "radial-gradient(32% 46% at 72% 36%, rgb(56 189 248 / 0.2), rgb(56 189 248 / 0.07) 42%, transparent 72%)",
  "radial-gradient(36% 42% at 58% 66%, rgb(251 146 60 / 0.16), rgb(251 146 60 / 0.05) 42%, transparent 72%)",
].join(", ");

/** Every text-bearing layer is opaque white with a hairline + shadow edge. */
const layerClass = "rounded-2xl border border-border bg-card text-left";

/**
 * The product in three moments, as real UI in miniature: someone requests
 * access, the owner reviews (or the timer releases), the requester receives
 * it. Purely illustrative, so it is hidden from assistive tech and inert.
 *
 * Phones get two stacked layers; tablets two overlapping ones; desktop all
 * three. The front card only ever overlaps the empty right side of the review
 * card's footer, so no layer hides another layer's text.
 */
export function HeroVisual({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none relative mx-auto w-full max-w-md select-none md:max-w-2xl lg:max-w-5xl",
        className,
      )}
    >
      <div
        className="absolute -inset-x-6 -inset-y-10 sm:-inset-x-12 md:-inset-x-24 md:-inset-y-16"
        style={{ backgroundImage: GLOW }}
      />

      <div className="relative md:h-[416px] lg:h-[436px]">
        <ShareCard className="hidden lg:absolute lg:top-16 lg:left-[2%] lg:block lg:w-[316px]" />
        <ReviewCard className="relative md:absolute md:top-0 md:left-0 md:w-[460px] lg:left-1/2 lg:w-[440px] lg:-translate-x-1/2" />
        <GrantedCard className="relative z-10 -mt-3 ml-auto w-[88%] md:absolute md:top-[219px] md:right-0 md:mt-0 md:w-[300px] md:motion-safe:animate-float lg:top-[240px] lg:right-[2%] lg:w-[316px]" />
      </div>
    </div>
  );
}

function ShareCard({ className }: { className?: string }) {
  return (
    <div className={cn(layerClass, "p-5 shadow-lg", className)}>
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-xs">
          <LockKeyholeIcon className="size-4 text-primary" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-foreground">
            Series A data room
          </p>
          <p className="text-xs text-muted-foreground">2 files · Request required</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <MockField label="Name" value="Avery Chen" />
        <MockField label="Email" value="avery@northwind.vc" />
      </div>

      <div className={cn(buttonVariants({ size: "sm" }), "mt-4 w-full")}>
        Request access
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock3Icon className="size-3.5 text-subtle-foreground" />
        Auto-releases after 1 day if not reviewed
      </p>
    </div>
  );
}

function MockField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1.5">
      <p className="text-xs font-medium text-foreground">{label}</p>
      <div className="flex h-9 items-center rounded-lg border border-input bg-card px-3 text-[0.8125rem] text-foreground shadow-xs">
        {value}
      </div>
    </div>
  );
}

function ReviewCard({ className }: { className?: string }) {
  return (
    <div className={cn(layerClass, "overflow-hidden shadow-xl", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <p className="text-sm font-semibold tracking-tight text-foreground">Needs review</p>
        <Badge variant="neutral">1 pending</Badge>
      </div>

      <div className="flex gap-3 p-4">
        <InitialsAvatar name="Avery Chen" email="avery@northwind.vc" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-sm font-semibold text-foreground">Avery Chen</p>
            <p className="shrink-0 text-xs text-muted-foreground">2m ago</p>
          </div>
          <p className="truncate text-[0.8125rem] text-muted-foreground">
            avery@northwind.vc · Series A data room
          </p>
          <p className="mt-2.5 rounded-lg bg-canvas px-3 py-2 text-[0.8125rem] leading-relaxed text-foreground">
            “Reviewing the deck ahead of Thursday’s partner meeting.”
          </p>
          <Badge variant="warning" dot className="mt-3">
            Auto-releases in 23h 59m
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-border bg-surface-subtle px-4 py-3">
        <span className={cn(buttonVariants({ size: "xs" }))}>Approve &amp; send</span>
        <span className={cn(buttonVariants({ variant: "outline", size: "xs" }))}>Decline</span>
      </div>
    </div>
  );
}

function GrantedCard({ className }: { className?: string }) {
  return (
    <div className={cn(layerClass, "p-4 shadow-xl", className)}>
      <div className="flex items-center gap-2">
        <span className="flex size-5 items-center justify-center rounded-md bg-foreground text-background">
          <LogoGlyph className="size-3.5" />
        </span>
        <p className="text-xs font-medium text-muted-foreground">Protected Assets</p>
        <p className="ml-auto text-xs text-muted-foreground">now</p>
      </div>

      <div className="mt-3 flex gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success-subtle text-success">
          <CheckIcon className="size-4" strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Access granted</p>
          <p className="mt-0.5 text-[0.8125rem] leading-snug text-muted-foreground">
            Series A data room is ready.
          </p>
        </div>
      </div>

      <ul className="mt-3 grid gap-1 rounded-xl bg-canvas p-1.5">
        <FileRow icon={FileTextIcon} name="Pitch deck.pdf" meta="Attached" />
        <FileRow icon={LinkIcon} name="Financial model.xlsx" meta="Download link" />
      </ul>
    </div>
  );
}

function FileRow({
  icon: Icon,
  name,
  meta,
}: {
  icon: LucideIcon;
  name: string;
  meta: string;
}) {
  return (
    <li className="flex items-center gap-2 rounded-lg bg-card px-2.5 py-1.5 shadow-xs">
      <Icon className="size-3.5 shrink-0 text-subtle-foreground" />
      <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{name}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{meta}</span>
    </li>
  );
}
