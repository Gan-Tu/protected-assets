# Protected Assets

Protected Assets is a Next.js app for sharing sensitive links and files behind a request flow. Owners can review access manually or enable timed auto-release, with email delivery once access is granted.

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
