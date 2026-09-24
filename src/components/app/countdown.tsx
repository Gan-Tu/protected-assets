"use client";

import { useCallback, useSyncExternalStore } from "react";

import { subscribeToClock } from "@/components/app/clock";
import { formatCountdown } from "@/lib/utils";

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
  const getSnapshot = useCallback(() => {
    const target = Date.parse(targetIso);
    if (Number.isNaN(target)) return null;

    const remaining = Math.max(0, Math.floor((target - Date.now()) / 1000));
    return remaining <= 0 ? expiredLabel : formatCountdown(remaining);
  }, [targetIso, expiredLabel]);

  const label = useSyncExternalStore(subscribeToClock, getSnapshot, () => null);

  return (
    <span className={className}>
      {label ?? "…"}
    </span>
  );
}
