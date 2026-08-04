"use client";

import { useSyncExternalStore } from "react";

import { formatRelativeWindow } from "@/lib/utils";

/** Ticks once a second; unsubscribes with the component. */
function subscribe(onChange: () => void) {
  const interval = setInterval(onChange, 1000);
  return () => clearInterval(interval);
}

const getNowSeconds = () => Math.floor(Date.now() / 1000);

/**
 * Live countdown to an auto-release. Auto-release is the product's headline
 * feature, so the queue shows "releases in 3h 12m" instead of a static window.
 *
 * Server-rendered output is intentionally a placeholder: any absolute value
 * would already be stale by the time it reached the browser.
 */
export function Countdown({
  targetIso,
  className,
  expiredLabel = "moments",
}: {
  targetIso: string;
  className?: string;
  expiredLabel?: string;
}) {
  const nowSeconds = useSyncExternalStore(
    subscribe,
    getNowSeconds,
    () => null,
  );

  if (nowSeconds === null) {
    return <span className={className}>&hellip;</span>;
  }

  const target = Date.parse(targetIso);
  if (Number.isNaN(target)) {
    return <span className={className}>&hellip;</span>;
  }

  const remaining = Math.max(0, Math.floor(target / 1000) - nowSeconds);

  return (
    <span className={className}>
      {remaining <= 0 ? expiredLabel : formatRelativeWindow(remaining)}
    </span>
  );
}
