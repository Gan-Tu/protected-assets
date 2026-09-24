import { GlobeIcon } from "lucide-react";

import { CopyLinkButton } from "@/components/app/copy-link-button";
import { Card } from "@/components/ui/card";

function splitUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.host,
      path: `${parsed.pathname}${parsed.search}`,
    };
  } catch {
    return { host: "", path: url };
  }
}

/**
 * The live share URL, Stripe payment-link style. When space runs out the host
 * truncates first (it shrinks 1000x faster), so the slug — the part that
 * identifies this asset — stays readable even on a phone.
 */
export function ShareLinkCard({ url }: { url: string }) {
  const { host, path } = splitUrl(url);

  return (
    <Card
      size="sm"
      className="gap-3 px-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5"
    >
      <div className="flex min-w-0 items-center gap-3 sm:w-64 sm:shrink-0">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-xs">
          <GlobeIcon className="size-4 text-subtle-foreground" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm leading-5 font-semibold tracking-tight text-foreground">
            Share link
          </h2>
          <p className="text-[0.8125rem] leading-5 text-muted-foreground">
            Anyone with it can request access.
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div
          title={url}
          className="flex h-10 min-w-0 flex-1 items-center rounded-lg border border-border bg-surface-subtle px-3 font-mono text-[0.8125rem] select-all"
        >
          <span className="min-w-0 truncate text-muted-foreground [flex-shrink:1000]">
            {host}
          </span>
          <span className="min-w-0 truncate text-foreground">{path}</span>
        </div>
        <CopyLinkButton value={url} size="default" className="h-10" />
      </div>
    </Card>
  );
}
