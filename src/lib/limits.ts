/**
 * Field caps shared by the zod schemas (server) and form controls (browser).
 * Deliberately dependency-free: importing `@/lib/validation` from a client
 * component would ship all of zod to the browser for a handful of numbers.
 */
export const LIMITS = {
  name: 120,
  slug: 40,
  description: 2000,
  reason: 2000,
  note: 2000,
  email: 254,
  phone: 32,
  url: 2048,
  linksPerAsset: 50,
  /** QStash caps scheduled delivery; keep the product below it with headroom. */
  maxAutoReleaseSeconds: 7 * 24 * 60 * 60,
} as const;
