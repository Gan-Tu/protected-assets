import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function compactFileSize(bytes: number | null | undefined) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Locale/timezone of whoever runs this. Safe in the browser; on the server it
 * reflects the server's timezone, so components render it only after mount.
 */
export function formatHumanDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * "Just now", "5m ago", "3h ago", "Yesterday", then a short date. Compact on
 * purpose: it sits in dense lists where the full timestamp lives in `title`.
 */
export function formatRelativeTime(value: string | Date, nowMs: number) {
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();

  if (Number.isNaN(time)) {
    return "Unknown";
  }

  const seconds = Math.round((nowMs - time) / 1000);

  if (seconds < 45) return "Just now";
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))}m ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
  if (seconds < 2 * 86400) return "Yesterday";
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)}d ago`;

  const sameYear = new Date(nowMs).getFullYear() === date.getFullYear();

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
}

/** Up to two initials from a name, falling back to the email's local part. */
export function getInitials(name: string | null | undefined, email: string) {
  const source = name?.trim() || email.split("@")[0] || "?";
  const words = source
    .replace(/[^\p{L}\p{N}\s._-]/gu, "")
    .split(/[\s._-]+/)
    .filter(Boolean);

  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Stable small integer for a string, e.g. to pick an avatar tone. */
export function hashToIndex(value: string, modulo: number) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % modulo;
}

/** Deterministic on both server and client, so it is safe to hydrate. */
export function formatUtcDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

/**
 * "Sep 24" in UTC: deterministic on server and client, and about as wide as
 * the "3d ago" label that replaces it after hydration, so rows don't jump.
 */
export function formatShortUtcDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** When a pending request will auto-release, or null if it never will. */
export function getAutoReleaseTargetIso(input: {
  createdAt: string;
  enabled: boolean;
  delaySeconds: number;
}): string | null {
  if (!input.enabled) return null;

  const created = Date.parse(input.createdAt);
  if (Number.isNaN(created)) return null;

  return new Date(created + input.delaySeconds * 1000).toISOString();
}

export function formatRelativeWindow(
  totalSeconds: number,
  options?: { verbose?: boolean },
) {
  if (totalSeconds <= 0) return "Immediately";

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const verbose = options?.verbose ?? false;

  const parts = [
    days
      ? verbose
        ? `${days} ${days === 1 ? "day" : "days"}`
        : `${days}d`
      : null,
    hours
      ? verbose
        ? `${hours} ${hours === 1 ? "hour" : "hours"}`
        : `${hours}h`
      : null,
    minutes
      ? verbose
        ? `${minutes} ${minutes === 1 ? "minute" : "minutes"}`
        : `${minutes}m`
      : null,
    seconds
      ? verbose
        ? `${seconds} ${seconds === 1 ? "second" : "seconds"}`
        : `${seconds}s`
      : null,
  ].filter(Boolean);

  return parts.join(" ");
}

/**
 * Live countdown label that coarsens with distance: "6d 23h", "3h 1m",
 * "4m 12s", "9s". Two units are enough to read at a glance, and a label that
 * only changes hourly lets subscribers skip re-rendering every second.
 */
export function formatCountdown(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;

  if (days) return hours ? `${days}d ${hours}h` : `${days}d`;
  if (hours) return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
  if (minutes) return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
  return `${rest}s`;
}

export function coerceBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

export function getBaseUrl() {
  /**
   * On preview deployments the configured app URL points at production, which
   * would make share pages and download links in emails jump to a different
   * build. Prefer the deployment's own URL there so a preview is self-contained.
   */
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function isLocalUrl(url: string) {
  return url.includes("localhost") || url.includes("127.0.0.1");
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
}
