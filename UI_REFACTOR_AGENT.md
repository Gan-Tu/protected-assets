# UI Refactor Handoff

This document is for a follow-up LLM coding session focused on improving the UI and UX of this project without breaking product behavior.

The project is already functionally implemented. The next agent should treat this as a product-preserving UI refactor, not a feature rewrite.

## Mission

Improve the visual design, polish, information architecture, and interaction quality of the app while preserving all existing functionality:

- owner auth
- owner dashboard
- protected asset creation and editing
- collections
- requester access flow
- owner approval / denial
- timed auto-release
- Resend / Supabase / QStash integrations

The app should remain functionally complete after the refactor.

## Product Summary

This app lets an owner protect assets behind a request-and-release workflow.

An asset can be:

- a protected hyperlink
- a protected document bundle stored in Supabase Storage

Each asset gets a short share URL. A requester opens that URL, sees a locked page, submits:

- their email
- their reason for requesting access

The owner is notified. The owner can:

- approve
- deny
- do nothing and allow auto-release if enabled

If auto-release is enabled, the requester is automatically sent the asset after a configured delay.

## Core Functional Requirements

These features must continue to work after the UI refactor.

### 1. Owner Authentication

Owners must be able to:

- sign up with email + password
- sign in with email + password
- sign in with Google OAuth
- sign in with GitHub OAuth
- sign out

Relevant files:

- [src/app/auth/sign-in/page.tsx](/Users/tugan/Documents/dev/auto-release-protected-assets/src/app/auth/sign-in/page.tsx)
- [src/app/auth/sign-up/page.tsx](/Users/tugan/Documents/dev/auto-release-protected-assets/src/app/auth/sign-up/page.tsx)
- [src/app/auth/actions.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/app/auth/actions.ts)
- [src/app/auth/callback/route.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/app/auth/callback/route.ts)
- [src/components/forms/auth-form.tsx](/Users/tugan/Documents/dev/auto-release-protected-assets/src/components/forms/auth-form.tsx)
- [src/components/forms/oauth-buttons.tsx](/Users/tugan/Documents/dev/auto-release-protected-assets/src/components/forms/oauth-buttons.tsx)

### 2. Owner Profile / Settings

Owners must be able to manage:

- account email visibility
- optional phone number
- email notifications on access requests
- SMS notifications on access requests

SMS support is optional at runtime, but the UI and settings flow must remain intact.

Relevant files:

- [src/app/dashboard/settings/page.tsx](/Users/tugan/Documents/dev/auto-release-protected-assets/src/app/dashboard/settings/page.tsx)
- [src/components/forms/profile-settings-form.tsx](/Users/tugan/Documents/dev/auto-release-protected-assets/src/components/forms/profile-settings-form.tsx)
- [src/app/dashboard/actions.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/app/dashboard/actions.ts)

### 3. Dashboard

The owner dashboard must support:

- overview / stats
- listing all assets
- viewing pending requests
- creating collections
- deleting collections
- deleting assets
- entering asset edit pages
- opening the public share page
- copying the public share URL

Current implementation note:

- collection deletion is currently exposed from the dashboard collections section
- asset deletion is currently exposed from the asset edit page
- both destructive actions now use confirmation dialogs

Relevant files:

- [src/app/dashboard/page.tsx](/Users/tugan/Documents/dev/auto-release-protected-assets/src/app/dashboard/page.tsx)
- [src/components/dashboard/request-decision-row.tsx](/Users/tugan/Documents/dev/auto-release-protected-assets/src/components/dashboard/request-decision-row.tsx)
- [src/components/app/confirm-submit-button.tsx](/Users/tugan/Documents/dev/auto-release-protected-assets/src/components/app/confirm-submit-button.tsx)

### 4. Collections

Collections are lightweight organizational folders for assets.

Required behavior:

- create collection
- assign asset to collection
- delete collection
- deleting a collection must NOT delete its assets
- assets in a deleted collection should become unassigned

This behavior is backed by DB `ON DELETE SET NULL`.

Relevant files:

- [src/lib/data.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/lib/data.ts)
- [src/app/dashboard/actions.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/app/dashboard/actions.ts)
- [src/app/dashboard/page.tsx](/Users/tugan/Documents/dev/auto-release-protected-assets/src/app/dashboard/page.tsx)
- [src/components/app/confirm-submit-button.tsx](/Users/tugan/Documents/dev/auto-release-protected-assets/src/components/app/confirm-submit-button.tsx)
- [supabase/schema.sql](/Users/tugan/Documents/dev/auto-release-protected-assets/supabase/schema.sql)

### 5. Asset Creation / Editing

Owners must be able to create and edit assets with:

- name
- short slug
- description
- collection assignment
- asset type
- advanced auto-release settings

Asset types:

- `link`
- `files`

Asset lifecycle requirements:

- create asset
- edit asset
- delete asset
- deleting an asset must remove associated file metadata
- deleting a file-bundle asset must also remove stored files from Supabase Storage

Link asset requirements:

- destination URL required

File asset requirements:

- at least one uploaded file if no existing files are attached
- files stored in private Supabase Storage bucket
- replacement flow supported for existing bundles

Relevant files:

- [src/app/dashboard/assets/new/page.tsx](/Users/tugan/Documents/dev/auto-release-protected-assets/src/app/dashboard/assets/new/page.tsx)
- [src/app/dashboard/assets/[assetId]/page.tsx](/Users/tugan/Documents/dev/auto-release-protected-assets/src/app/dashboard/assets/%5BassetId%5D/page.tsx)
- [src/components/forms/asset-form.tsx](/Users/tugan/Documents/dev/auto-release-protected-assets/src/components/forms/asset-form.tsx)
- [src/components/app/confirm-submit-button.tsx](/Users/tugan/Documents/dev/auto-release-protected-assets/src/components/app/confirm-submit-button.tsx)
- [src/app/dashboard/actions.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/app/dashboard/actions.ts)
- [src/lib/data.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/lib/data.ts)

### 6. Protected Public Share Page

Anyone with a share URL must be able to:

- view the locked asset page
- see asset name and description
- see that access is protected
- see whether auto-release is enabled
- see the auto-release countdown text if enabled
- submit a request with email + reason

Relevant files:

- [src/app/a/[slug]/page.tsx](/Users/tugan/Documents/dev/auto-release-protected-assets/src/app/a/%5Bslug%5D/page.tsx)
- [src/components/forms/request-access-form.tsx](/Users/tugan/Documents/dev/auto-release-protected-assets/src/components/forms/request-access-form.tsx)
- [src/app/a/[slug]/actions.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/app/a/%5Bslug%5D/actions.ts)

### 7. Request Submission Flow

When a requester submits a request:

- create `access_requests` row with `pending` status
- notify owner by email if enabled
- notify owner by SMS if enabled and Twilio is configured
- if auto-release is enabled, schedule timed release through QStash
- if auto-release cannot be scheduled, do not leave behind a fake request

Relevant files:

- [src/lib/data.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/lib/data.ts)
- [src/lib/notifications.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/lib/notifications.ts)
- [src/lib/qstash.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/lib/qstash.ts)

### 8. Approval / Denial Flow

Owner must be able to:

- approve pending requests
- deny pending requests

Approve behavior:

- request status becomes `approved`
- `approved_at` and `released_at` timestamps set
- requester receives asset by email

Deny behavior:

- request status becomes `denied`
- `denied_at` timestamp set
- requester receives denial email

Relevant files:

- [src/components/dashboard/request-decision-row.tsx](/Users/tugan/Documents/dev/auto-release-protected-assets/src/components/dashboard/request-decision-row.tsx)
- [src/app/dashboard/actions.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/app/dashboard/actions.ts)
- [src/lib/data.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/lib/data.ts)
- [src/lib/notifications.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/lib/notifications.ts)

### 9. Auto-Release

Auto-release is a required product feature.

Current behavior:

- owner enables auto-release per asset
- delay is now second-based
- QStash schedules a delayed callback to this app
- callback marks request as `auto_approved`
- requester receives asset automatically

Current constraints:

- QStash requires a public callback URL
- `QSTASH_CALLBACK_URL` should point to a deployed app URL or tunnel URL
- local `localhost` callback URLs are rejected
- schedule verification uses the same callback URL for signature validation

Relevant files:

- [src/lib/qstash.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/lib/qstash.ts)
- [src/app/api/qstash/auto-release/route.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/app/api/qstash/auto-release/route.ts)
- [src/lib/data.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/lib/data.ts)
- [src/lib/utils.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/lib/utils.ts)

### 10. Asset Delivery

Delivery must remain correct:

- link asset: requester receives direct URL
- file asset: requester receives signed Supabase Storage download links

Storage requirements:

- actual file blobs stored in Supabase Storage bucket `asset-documents`
- metadata stored in Postgres `asset_files`

Relevant files:

- [src/lib/constants.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/lib/constants.ts)
- [src/lib/data.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/lib/data.ts)
- [supabase/schema.sql](/Users/tugan/Documents/dev/auto-release-protected-assets/supabase/schema.sql)

## Current Routes

Important routes that should remain functionally intact:

- `/`
- `/auth/sign-in`
- `/auth/sign-up`
- `/auth/callback`
- `/dashboard`
- `/dashboard/assets/new`
- `/dashboard/assets/[assetId]`
- `/dashboard/settings`
- `/a/[slug]`
- `/api/qstash/auto-release`

## Current Integrations

### Supabase

Used for:

- auth
- database
- storage

Important files:

- [src/lib/supabase/client.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/lib/supabase/client.ts)
- [src/lib/supabase/server.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/lib/supabase/server.ts)
- [src/lib/supabase/middleware.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/lib/supabase/middleware.ts)
- [src/proxy.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/proxy.ts)

### Resend

Used for:

- owner notifications
- requester approval emails
- requester denial emails

Important file:

- [src/lib/notifications.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/lib/notifications.ts)

### Upstash QStash

Used for:

- delayed auto-release callbacks

Important files:

- [src/lib/qstash.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/lib/qstash.ts)
- [src/app/api/qstash/auto-release/route.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/app/api/qstash/auto-release/route.ts)

### Twilio

Used for:

- optional SMS notifications to owner

Important file:

- [src/lib/notifications.ts](/Users/tugan/Documents/dev/auto-release-protected-assets/src/lib/notifications.ts)

## Environment Requirements

Required for app operation:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Required for email:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Required for auto-release:

- `QSTASH_TOKEN`
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`
- `QSTASH_CALLBACK_URL`

Optional:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

See:

- [.env.example](/Users/tugan/Documents/dev/auto-release-protected-assets/.env.example)

## Data Model Summary

Main tables:

- `profiles`
- `asset_groups`
- `assets`
- `asset_files`
- `access_requests`

Current schema:

- [supabase/schema.sql](/Users/tugan/Documents/dev/auto-release-protected-assets/supabase/schema.sql)

Important migration:

- [supabase/migrations/20260310_auto_approve_seconds.sql](/Users/tugan/Documents/dev/auto-release-protected-assets/supabase/migrations/20260310_auto_approve_seconds.sql)

The next agent must not regress the DB assumptions:

- assets belong to owner profile
- collection delete unassigns assets
- asset delete removes asset records cleanly
- file blobs live in storage bucket, not Postgres
- access request state transitions are important

## UI Refactor Goals

The current UI is functional but should be improved substantially.

Suggested refactor priorities:

- clearer dashboard hierarchy
- better density / spacing / scanning for owner workflows
- stronger separation between collections, assets, and pending requests
- better mobile responsiveness
- clearer form grouping and progressive disclosure
- more polished request status visuals
- stronger feedback states
- reduce places where actions look too similar
- improve empty states and saved / success states
- improve visual distinction between link assets and file bundles
- improve advanced settings presentation
- improve account settings UX
- improve share page trust and clarity for requesters

## UI / UX Constraints

Do not break the stack or project conventions:

- Next.js app router
- Tailwind CSS
- functional React only
- TypeScript
- shadcn-style component approach
- Framer Motion can be used where it adds value

Repo-specific constraints:

- clickable web UI elements should include `cursor-pointer`
- avoid replacing server actions with unnecessary client-side API complexity
- do not remove required integrations
- preserve existing routes unless a replacement is deliberate and complete

## Important Product Semantics

These are easy to accidentally break during a UI refactor:

- auto-release must be visibly communicated to the requester before request submission
- owner must still be able to approve and deny directly from the dashboard
- collection deletion must not delete assets
- asset deletion must not leave orphaned storage files behind
- destructive actions should keep a confirmation dialog or equivalent safety affordance
- file assets must continue using signed URLs in release email
- request rows must not get stuck in a fake scheduled state if QStash scheduling fails
- redirect behavior in server actions must remain outside `try/catch`
- auth pages must continue to support both password and OAuth flows

## Recommended Refactor Strategy

The next agent should work in this order:

1. Audit current layout and identify the weakest information architecture areas.
2. Refactor top-level dashboard layout and collections / assets / requests grouping.
3. Refactor asset create/edit experience.
4. Refactor public requester page.
5. Refactor auth pages and settings page.
6. Improve empty states, loading states, and post-action feedback.
7. Re-run functional verification.

## Acceptance Checklist

Before finishing, the next agent should verify all of these:

- owner can sign up
- owner can sign in
- Google OAuth still works
- GitHub OAuth still works
- owner profile/settings save correctly
- collection can be created
- collection can be deleted
- asset can be created as link
- asset can be created as file bundle
- asset can be edited
- asset can be deleted
- delete actions show confirmation before executing
- asset can be assigned to collection
- public share page loads
- requester can submit request
- owner receives notification
- owner can approve request
- owner can deny request
- requester receives approved asset email
- requester receives denied email
- auto-release schedules via QStash
- auto-release callback verifies correctly
- auto-release email sends correctly
- second-based delay values work
- mobile layout is usable
- `pnpm lint` passes
- `pnpm build` passes

## If the Refactor Touches Auto-Release

Do not forget:

- QStash callback URL must stay aligned between scheduling and verification
- delay values are now second-based
- Supabase must have the seconds migration applied
- public callback URLs only, not `localhost`

## If the Refactor Touches Forms

Watch out for:

- server action redirects being caught as errors
- uncontrolled input warnings
- broken multipart file upload handling
- hidden inputs required by actions

## Minimal Rule

If a UI improvement risks breaking functionality, preserve functionality first.

The product is not a marketing site. It is a workflow app, and the dashboard, forms, approvals, and release pipeline are more important than decorative UI.
