import { describe, expect, it } from "vitest";

import {
  compactFileSize,
  formatCountdown,
  formatRelativeTime,
  formatRelativeWindow,
  formatShortUtcDate,
  getInitials,
  hashToIndex,
  getAutoReleaseTargetIso,
  isLocalUrl,
  slugify,
} from "@/lib/utils";

describe("formatRelativeWindow", () => {
  it("renders compact and verbose forms", () => {
    expect(formatRelativeWindow(90061)).toBe("1d 1h 1m 1s");
    expect(formatRelativeWindow(3600, { verbose: true })).toBe("1 hour");
    expect(formatRelativeWindow(7200, { verbose: true })).toBe("2 hours");
  });

  it("treats zero and negatives as immediate", () => {
    expect(formatRelativeWindow(0)).toBe("Immediately");
    expect(formatRelativeWindow(-5)).toBe("Immediately");
  });
});

describe("getAutoReleaseTargetIso", () => {
  it("adds the delay to the request time", () => {
    const target = getAutoReleaseTargetIso({
      createdAt: "2026-01-01T00:00:00.000Z",
      enabled: true,
      delaySeconds: 3600,
    });

    expect(target).toBe("2026-01-01T01:00:00.000Z");
  });

  it("returns null when auto-release is off or the date is unusable", () => {
    expect(
      getAutoReleaseTargetIso({
        createdAt: "2026-01-01T00:00:00.000Z",
        enabled: false,
        delaySeconds: 3600,
      }),
    ).toBeNull();

    expect(
      getAutoReleaseTargetIso({
        createdAt: "not a date",
        enabled: true,
        delaySeconds: 60,
      }),
    ).toBeNull();
  });
});

describe("slugify", () => {
  it("produces url-safe slugs", () => {
    expect(slugify("  Q1 Investor Deck!! ")).toBe("q1-investor-deck");
    expect(slugify("../../etc/passwd")).toBe("etc-passwd");
  });

  it("caps length", () => {
    expect(slugify("a".repeat(80))).toHaveLength(40);
  });
});

describe("compactFileSize", () => {
  it("formats byte counts", () => {
    expect(compactFileSize(0)).toBe("0 B");
    expect(compactFileSize(null)).toBe("0 B");
    expect(compactFileSize(999)).toBe("999 B");
    expect(compactFileSize(1024)).toBe("1.0 KB");
    expect(compactFileSize(28 * 1024 * 1024)).toBe("28 MB");
  });
});

describe("isLocalUrl", () => {
  it("detects loopback callback URLs", () => {
    expect(isLocalUrl("http://localhost:3000")).toBe(true);
    expect(isLocalUrl("http://127.0.0.1:3000")).toBe(true);
    expect(isLocalUrl("https://protected.example.com")).toBe(false);
  });
});

describe("formatRelativeTime", () => {
  const now = Date.parse("2026-06-15T12:00:00.000Z");
  const ago = (seconds: number) => new Date(now - seconds * 1000).toISOString();

  it("buckets recent times compactly", () => {
    expect(formatRelativeTime(ago(10), now)).toBe("Just now");
    expect(formatRelativeTime(ago(60 * 5), now)).toBe("5m ago");
    expect(formatRelativeTime(ago(3600 * 3), now)).toBe("3h ago");
    expect(formatRelativeTime(ago(86400 + 60), now)).toBe("Yesterday");
    expect(formatRelativeTime(ago(86400 * 4), now)).toBe("4d ago");
  });

  it("falls back to a date for older values and survives bad input", () => {
    expect(formatRelativeTime(ago(86400 * 30), now)).not.toMatch(/ago/);
    expect(formatRelativeTime("not a date", now)).toBe("Unknown");
  });
});

describe("getInitials", () => {
  it("prefers the name and falls back to the email", () => {
    expect(getInitials("Ada Lovelace", "ada@example.com")).toBe("AL");
    expect(getInitials("  ", "grace.hopper@example.com")).toBe("GH");
    expect(getInitials(null, "zed@example.com")).toBe("ZE");
    expect(getInitials("Jean-Luc Picard", "x@example.com")).toBe("JP");
  });
});

describe("hashToIndex", () => {
  it("is stable and in range", () => {
    const first = hashToIndex("ada@example.com", 7);
    expect(first).toBe(hashToIndex("ada@example.com", 7));
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(7);
  });
});

describe("formatShortUtcDate", () => {
  it("is a compact, timezone-independent date", () => {
    expect(formatShortUtcDate("2026-09-24T23:30:00.000Z")).toBe("Sep 24");
    expect(formatShortUtcDate("nope")).toBe("Unknown");
  });
});

describe("formatCountdown", () => {
  it("keeps the two most significant units", () => {
    expect(formatCountdown(6 * 86400 + 23 * 3600 + 59 * 60 + 53)).toBe("6d 23h");
    expect(formatCountdown(3 * 3600 + 62)).toBe("3h 1m");
    expect(formatCountdown(4 * 60 + 12)).toBe("4m 12s");
    expect(formatCountdown(9)).toBe("9s");
  });

  it("drops empty trailing units and clamps negatives", () => {
    expect(formatCountdown(2 * 86400)).toBe("2d");
    expect(formatCountdown(3600)).toBe("1h");
    expect(formatCountdown(-4)).toBe("0s");
  });
});
