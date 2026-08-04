import { describe, expect, it } from "vitest";

import {
  MemoryQuotaStore,
  RATE_LIMITS,
  describeRetryAfter,
  evaluateDurableQuota,
  getClientIp,
} from "@/lib/rate-limit";

const quota = { limit: 3, windowSeconds: 60 };

describe("MemoryQuotaStore", () => {
  it("allows up to the limit then rejects", () => {
    const store = new MemoryQuotaStore();
    const now = 1_000_000;

    expect(store.consume("ip", quota, now).ok).toBe(true);
    expect(store.consume("ip", quota, now).ok).toBe(true);
    expect(store.consume("ip", quota, now).ok).toBe(true);

    const blocked = store.consume("ip", quota, now);
    expect(blocked.ok).toBe(false);
    expect(blocked.ok === false && blocked.retryAfterSeconds).toBe(60);
  });

  it("keeps separate keys independent", () => {
    const store = new MemoryQuotaStore();
    const now = 0;

    for (let i = 0; i < 3; i += 1) store.consume("a", quota, now);

    expect(store.consume("a", quota, now).ok).toBe(false);
    expect(store.consume("b", quota, now).ok).toBe(true);
  });

  it("resets once the window rolls over", () => {
    const store = new MemoryQuotaStore();
    const start = 5_000;

    for (let i = 0; i < 3; i += 1) store.consume("ip", quota, start);
    expect(store.consume("ip", quota, start).ok).toBe(false);

    // One millisecond past the window boundary.
    expect(store.consume("ip", quota, start + 60_001).ok).toBe(true);
  });

  it("counts down the retry hint as the window elapses", () => {
    const store = new MemoryQuotaStore();
    const start = 0;

    for (let i = 0; i < 3; i += 1) store.consume("ip", quota, start);

    const blocked = store.consume("ip", quota, start + 30_000);
    expect(blocked.ok === false && blocked.retryAfterSeconds).toBe(30);
  });
});

describe("evaluateDurableQuota", () => {
  it("permits while under the limit", () => {
    expect(evaluateDurableQuota(2, RATE_LIMITS.perEmailPerAsset).ok).toBe(true);
  });

  it("blocks once the count reaches the limit", () => {
    const result = evaluateDurableQuota(
      RATE_LIMITS.perEmailPerAsset.limit,
      RATE_LIMITS.perEmailPerAsset,
    );

    expect(result.ok).toBe(false);
  });
});

describe("getClientIp", () => {
  it("takes the left-most forwarded address", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.9, 70.41.3.18, 150.172.238.178",
    });

    expect(getClientIp(headers)).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip, then a constant", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "198.51.100.7" }))).toBe(
      "198.51.100.7",
    );
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("describeRetryAfter", () => {
  it("scales the wording to the wait", () => {
    expect(describeRetryAfter(30)).toBe("in a minute");
    expect(describeRetryAfter(600)).toBe("in 10 minutes");
    expect(describeRetryAfter(7200)).toBe("in 2 hours");
    expect(describeRetryAfter(90000)).toBe("later");
  });
});
