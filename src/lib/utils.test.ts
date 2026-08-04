import { describe, expect, it } from "vitest";

import {
  compactFileSize,
  formatRelativeWindow,
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
