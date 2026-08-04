"use client";

import { useSyncExternalStore } from "react";

import { formatHumanDateTime, formatUtcDateTime } from "@/lib/utils";

/** Never changes after hydration, so subscribers are never notified. */
const subscribe = () => () => {};

/**
 * Timestamps rendered on the server use the server's timezone, which is not the
 * reader's. We emit a stable UTC string during SSR (so hydration matches) and
 * switch to the visitor's locale once mounted.
 */
export function LocalTime({
  value,
  className,
  prefix,
}: {
  value: string | null | undefined;
  className?: string;
  prefix?: string;
}) {
  const isHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!value) return null;

  const utc = formatUtcDateTime(value);

  return (
    <time dateTime={value} className={className} title={utc}>
      {prefix}
      {isHydrated ? formatHumanDateTime(value) : utc}
    </time>
  );
}
