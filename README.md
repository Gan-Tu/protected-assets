# Protected Assets

Protected Assets is a Next.js app for sharing sensitive links and files behind a
request flow. Owners can review access manually or enable timed auto-release,
with email delivery once access is granted.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase for auth, data, and storage
- Resend for email
- Upstash QStash for scheduled auto-release

## Local Setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` and fill in the required values.
3. Start the app with `pnpm dev`.
4. Open `http://localhost:3000`.

## Scripts

- `pnpm dev` - start the local dev server
- `pnpm build` - build for production
- `pnpm start` - run the production build
- `pnpm lint` - run ESLint
- `pnpm typecheck` - run TypeScript with no emit
- `pnpm test` - run the unit tests (`pnpm test:watch` to iterate)

## Architecture

```
src/
  app/                  routes + server actions (thin: parse, call a service, shape a result)
  lib/
    auth.ts             request-cached session lookup + requireOwner
    validation.ts       zod schemas and caps for every trust boundary
    errors.ts           AppError vs. everything else; sanitizes messages
    rate-limit.ts       in-process burst limiter + durable-quota policy
    repos/              database and storage access, always owner-scoped
    services/           orchestration (save asset, submit request, release, deny)
```

Two rules keep the tenancy model honest:

1. **Every repo function takes `ownerId` first and filters on it.** All queries
   run with the Supabase *service-role* key, so Postgres RLS is bypassed and
   this layer is the only thing enforcing tenancy. `assertAssetOwnership` must
   be called before any write that accepts an asset id from a form.
2. **Server actions never trust their input.** Everything is parsed with a zod
   schema from `lib/validation.ts` before it reaches a service.

RLS policies do exist (`supabase/migrations/*_enable_rls_policies.sql`) and are
worth keeping as defence in depth, but note they are *not* what protects the
app today. Moving owner CRUD onto the user-scoped Supabase client so RLS becomes
load-bearing is the highest-value follow-up.

## Delivery model

- **Uploads** go from the browser straight to Supabase Storage using a signed
  upload URL minted server-side. The server chooses every object key
  (`<ownerId>/<assetId>/<file>`), and `isOwnedStoragePath` re-checks that prefix
  before recording an upload, so a client cannot claim someone else's object.
- **Release** claims the request row atomically, *then* delivers, *then* cancels
  the auto-release timer. If delivery throws, the claim is reverted and the
  request returns to `pending` so QStash (or the owner) can retry. Resend
  idempotency keys make a retry safe.
- **Downloads** are mediated by `/d/[requestId]/[fileId]`, not by long-lived
  Supabase signed URLs. Authorization is re-checked on every hit, so clearing a
  request revokes links that were already emailed. See
  `DOWNLOAD_LINK_TTL_SECONDS`.

## Abuse controls

`lib/rate-limit.ts` combines an in-process per-IP limiter (best effort; serverless
instances are not shared) with durable counts derived from `access_requests`
rows. Duplicate pending requests for the same (asset, email) are collapsed rather
than inserted. Adding a shared Redis later means swapping `consumeMemoryQuota`
for `@upstash/ratelimit` and leaving the policy constants alone.

## Environment

See `.env.example`. Notes on the subtle ones:

- `NEXT_PUBLIC_APP_URL` - base URL used for share pages and email links.
  On Vercel **preview** deployments the deployment's own URL wins, so a preview
  is self-contained.
- `QSTASH_CALLBACK_URL` - where QStash delivers the auto-release webhook. It is
  independent of `NEXT_PUBLIC_APP_URL`; if it points at production then
  auto-release scheduled from a preview is executed by production.
- Auto-release silently disables itself when the callback URL is localhost
  (QStash cannot reach it). The request degrades to manual review.
- Without `RESEND_API_KEY`/`RESEND_FROM_EMAIL`, sending **fails loudly** rather
  than pretending to succeed.

## Database

- `supabase/migrations/` - additive, safe to run in order.
- `supabase/maintenance/` - hand-run operational scripts. Not migrations; read
  the README there before running anything.
- `supabase/schema.sql` is a full-schema snapshot and has drifted from the
  migration list; treat the migrations as the source of truth.
