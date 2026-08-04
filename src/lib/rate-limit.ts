/**
 * Abuse controls for the unauthenticated request flow.
 *
 * Two layers, neither of which needs a schema change:
 *  - an in-process fixed-window counter for per-IP bursts. Serverless instances
 *    are not shared, so this is best-effort: it stops a single client hammering
 *    one instance, not a distributed flood.
 *  - durable counts derived from `access_requests` rows (see the requests repo),
 *    which survive across instances and cap the blast radius on the owner's
 *    inbox, phone and QStash bill.
 *
 * If a shared Redis ever lands in the stack, swap `consumeMemoryQuota` for
 * `@upstash/ratelimit` and the policy below stays exactly the same.
 */

export type Quota = { limit: number; windowSeconds: number };

export const RATE_LIMITS = {
  /** Per client IP, all assets. Stops naive scripted floods. */
  perIp: { limit: 10, windowSeconds: 60 * 60 } satisfies Quota,
  /** Durable: same person re-asking for the same asset. */
  perEmailPerAsset: { limit: 3, windowSeconds: 24 * 60 * 60 } satisfies Quota,
  /** Durable: caps notifications for a single asset (owner inbox + SMS). */
  perAsset: { limit: 30, windowSeconds: 60 * 60 } satisfies Quota,
  /** Durable: one address spraying every asset an owner has. */
  perEmail: { limit: 10, windowSeconds: 60 * 60 } satisfies Quota,
} as const;

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

type Bucket = { count: number; resetAt: number };

const MAX_TRACKED_KEYS = 10_000;

/** Exported for tests; production code goes through `consumeMemoryQuota`. */
export class MemoryQuotaStore {
  private readonly buckets = new Map<string, Bucket>();

  consume(key: string, quota: Quota, now: number): RateLimitResult {
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.prune(now);
      this.buckets.set(key, {
        count: 1,
        resetAt: now + quota.windowSeconds * 1000,
      });
      return { ok: true };
    }

    if (bucket.count >= quota.limit) {
      return {
        ok: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((bucket.resetAt - now) / 1000),
        ),
      };
    }

    bucket.count += 1;
    return { ok: true };
  }

  private prune(now: number) {
    if (this.buckets.size < MAX_TRACKED_KEYS) {
      // Cheap path: only sweep once the map is actually large.
      return;
    }

    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }

    // Still full of live buckets: drop the oldest to bound memory.
    if (this.buckets.size >= MAX_TRACKED_KEYS) {
      const oldest = [...this.buckets.entries()]
        .sort((a, b) => a[1].resetAt - b[1].resetAt)
        .slice(0, Math.floor(MAX_TRACKED_KEYS / 4));

      for (const [key] of oldest) {
        this.buckets.delete(key);
      }
    }
  }

  clear() {
    this.buckets.clear();
  }

  get size() {
    return this.buckets.size;
  }
}

const globalStore = new MemoryQuotaStore();

export function consumeMemoryQuota(
  key: string,
  quota: Quota,
  now: number = Date.now(),
): RateLimitResult {
  return globalStore.consume(key, quota, now);
}

export function resetMemoryQuotas() {
  globalStore.clear();
}

/**
 * Turn a durable count into a limit decision. `windowSeconds` is reported as
 * the retry hint because we only know the count, not the oldest timestamp.
 */
export function evaluateDurableQuota(
  count: number,
  quota: Quota,
): RateLimitResult {
  if (count < quota.limit) {
    return { ok: true };
  }

  return { ok: false, retryAfterSeconds: quota.windowSeconds };
}

/**
 * Best-effort client IP. Vercel sets `x-forwarded-for`; the left-most entry is
 * the client. Falls back to a constant so the limiter degrades to a global
 * cap rather than silently letting everything through.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");

  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return headers.get("x-real-ip")?.trim() || "unknown";
}

export function describeRetryAfter(seconds: number): string {
  if (seconds <= 90) return "in a minute";
  if (seconds <= 60 * 60) return `in ${Math.ceil(seconds / 60)} minutes`;
  if (seconds <= 24 * 60 * 60) return `in ${Math.ceil(seconds / 3600)} hours`;
  return "later";
}
