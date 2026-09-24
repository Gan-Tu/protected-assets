"use client";

import { useCallback, useSyncExternalStore } from "react";

import { subscribeNever, subscribeToClock } from "@/components/app/clock";
import {
  formatHumanDateTime,
  formatRelativeTime,
  formatShortUtcDate,
  formatUtcDateTime,
} from "@/lib/utils";

const getServerNull = () => null;

/**
 * Timestamps rendered on the server use the server's timezone, which is not the
 * reader's. We emit a stable UTC string during SSR (so hydration matches) and
 * switch to the visitor's locale once mounted.
 *
 * `relative` renders "5m ago" (kept fresh by the shared clock); the absolute
 * local time is always available on hover via `title`.
 */
export function LocalTime({
  value,
  className,
  prefix,
  relative = false,
}: {
  value: string | null | undefined;
  className?: string;
  prefix?: string;
  relative?: boolean;
}) {
  const isHydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  const getRelative = useCallback(
    () => (relative && value ? formatRelativeTime(value, Date.now()) : null),
    [relative, value],
  );
  const relativeLabel = useSyncExternalStore(
    relative ? subscribeToClock : subscribeNever,
    getRelative,
    getServerNull,
  );

  if (!value) return null;

  const absolute = isHydrated
    ? formatHumanDateTime(value)
    : formatUtcDateTime(value);
  // Before hydration a relative stamp shows a short UTC date, not the full
  // timestamp, so the swap to "3d ago" barely changes the row's width.
  const label = relative
    ? (relativeLabel ?? formatShortUtcDate(value))
    : absolute;

  return (
    <time dateTime={value} className={className} title={absolute}>
      {prefix}
      {label}
    </time>
  );
}
