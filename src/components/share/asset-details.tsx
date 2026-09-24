import {
  ArrowDownIcon,
  ClockIcon,
  FileTextIcon,
  Link2Icon,
  LockIcon,
  MailIcon,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PublicAssetView } from "@/lib/types";
import { cn, formatRelativeWindow } from "@/lib/utils";

export type ShareAsset = Pick<
  PublicAssetView,
  | "name"
  | "description"
  | "linkCount"
  | "fileCount"
  | "auto_approve_enabled"
  | "auto_approve_delay_seconds"
>;

const FALLBACK_DESCRIPTION =
  "This asset is protected. Tell the owner who you are and why you need it, and they’ll reply by email.";

function countLabel(count: number, noun: string) {
  return `${count} ${count === 1 ? noun : `${noun}s`}`;
}

/** "after 5 days", or "right away" for a zero window. */
function autoReleaseWindow(seconds: number) {
  return seconds > 0
    ? `after ${formatRelativeWindow(seconds, { verbose: true })}`
    : "right away";
}

/** Roughly ten lines on a phone: past this the form drops well below the fold. */
function isLongText(text: string) {
  return text.length > 600 || text.split("\n").length > 8;
}

/**
 * Eyebrow, title and the owner's description (kept as they typed it). Below
 * `lg` a long description would push the form a screen or more down, so a
 * jump link to it sits in the eyebrow row.
 */
export function AssetIntro({
  asset,
  formAnchor,
}: {
  asset: ShareAsset;
  /** Element id of the request form, for the jump link. */
  formAnchor?: string;
}) {
  const description = asset.description?.trim();

  return (
    <div className="space-y-4">
      <div className="flex min-h-7 items-center justify-between gap-3">
        <Badge variant="accent">
          <LockIcon aria-hidden />
          Protected asset
        </Badge>
        {formAnchor && description && isLongText(description) ? (
          <a
            href={`#${formAnchor}`}
            className="-mr-2 inline-flex h-7 items-center gap-1 rounded-md px-2 text-[0.8125rem] font-medium text-primary outline-none transition-colors duration-150 ease-out-soft hover:bg-primary-subtle focus-visible:ring-4 focus-visible:ring-primary/25 lg:hidden"
          >
            Skip to request
            <ArrowDownIcon className="size-3.5" aria-hidden />
          </a>
        ) : null}
      </div>
      <h1 className="text-3xl leading-[1.15] font-semibold tracking-[-0.03em] break-words text-foreground sm:text-4xl sm:leading-[1.1]">
        {asset.name}
      </h1>
      <p className="max-w-prose text-[0.9375rem] leading-relaxed break-words whitespace-pre-line text-pretty text-muted-foreground sm:text-base">
        {description || FALLBACK_DESCRIPTION}
      </p>
    </div>
  );
}

type Deliverable = { icon: LucideIcon; label: string; detail: string };

function getDeliverables(asset: ShareAsset): Deliverable[] {
  const items: Deliverable[] = [];

  if (asset.linkCount > 0) {
    items.push({
      icon: Link2Icon,
      label: countLabel(asset.linkCount, "link"),
      detail: "Emailed to you once access is granted.",
    });
  }

  if (asset.fileCount > 0) {
    items.push({
      icon: FileTextIcon,
      label: countLabel(asset.fileCount, "file"),
      detail: "Sent as attachments or expiring download links.",
    });
  }

  if (!items.length) {
    items.push({
      icon: MailIcon,
      label: "Delivered by email",
      detail: "Access details arrive in your inbox once granted.",
    });
  }

  return items;
}

export function AssetDeliverables({ asset }: { asset: ShareAsset }) {
  const items = getDeliverables(asset);

  return (
    <section aria-labelledby="share-receive-heading" className="space-y-3.5">
      <h2
        id="share-receive-heading"
        className="text-[0.9375rem] font-semibold tracking-tight text-foreground"
      >
        What you’ll receive
      </h2>
      <ul
        role="list"
        className={cn("grid gap-4", items.length > 1 && "sm:grid-cols-2")}
      >
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary shadow-xs">
              <item.icon className="size-[1.125rem]" aria-hidden />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm leading-5 font-medium text-foreground tabular">
                {item.label}
              </p>
              <p className="text-[0.8125rem] leading-5 text-pretty text-muted-foreground">
                {item.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HowItWorks({ asset }: { asset: ShareAsset }) {
  const steps: Array<{
    title: string;
    body: string;
    note?: React.ReactNode;
  }> = [
    {
      title: "Request access",
      body: "Share your name, email and why you need it.",
    },
    {
      title: "Owner reviews",
      body: "The owner approves or declines your request.",
      note: asset.auto_approve_enabled ? (
        <p className="mt-3 flex gap-2.5 rounded-xl border border-warning/15 bg-warning-subtle px-3.5 py-3 text-[0.8125rem] leading-5 text-warning">
          <ClockIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span className="min-w-0 text-pretty">
            <strong className="font-semibold">
              Or it auto-releases{" "}
              {autoReleaseWindow(asset.auto_approve_delay_seconds)}
            </strong>{" "}
            if the owner hasn’t responded by then.
          </span>
        </p>
      ) : null,
    },
    {
      title: "Delivered to your inbox",
      body: "Once access is granted, everything arrives by email. No account needed.",
    },
  ];

  return (
    <section aria-labelledby="share-how-heading" className="space-y-4">
      <h2
        id="share-how-heading"
        className="text-[0.9375rem] font-semibold tracking-tight text-foreground"
      >
        How it works
      </h2>
      <ol role="list" className="space-y-5">
        {steps.map((step, index) => (
          <li key={step.title} className="relative flex gap-3.5">
            {index < steps.length - 1 ? (
              <span
                aria-hidden
                className="absolute top-8 -bottom-4 left-[13px] w-px bg-border-strong"
              />
            ) : null}
            <span
              aria-hidden
              className="relative flex size-7 shrink-0 items-center justify-center rounded-full border border-border-strong bg-card text-xs font-semibold text-foreground shadow-xs tabular"
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 pt-[3px]">
              <p className="text-sm leading-5 font-medium text-foreground">
                {step.title}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-pretty text-muted-foreground">
                {step.body}
              </p>
              {step.note}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
