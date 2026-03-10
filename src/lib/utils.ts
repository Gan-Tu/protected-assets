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

export function coerceBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

export function getBaseUrl() {
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
