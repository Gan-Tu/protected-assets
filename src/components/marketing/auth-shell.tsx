import { CheckIcon } from "lucide-react";

import { LogoMark } from "@/components/app/logo-mark";

const highlights = [
  "Request-gated links and file bundles",
  "Timed auto-release, up to 7 days",
  "Email and SMS alerts for new requests",
];

/**
 * Tucked into the bottom-right corner, away from the copy. Even where both
 * gradients peak, muted text would still hold 4.75:1 on it.
 */
const PANEL_GLOW = [
  "radial-gradient(60% 45% at 100% 100%, rgb(90 79 236 / 0.08), transparent 72%)",
  "radial-gradient(40% 30% at 70% 100%, rgb(56 189 248 / 0.06), transparent 72%)",
].join(", ");

/**
 * Shared frame for sign-in and sign-up. From `lg` a calm brand panel sits
 * beside the form; below that it is a single, compact column. The form's own
 * title is the page's h1, so the panel copy is plain text.
 */
export function AuthShell({
  headline,
  tagline,
  children,
}: {
  headline: React.ReactNode;
  tagline: string;
  children: React.ReactNode;
}) {
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:grid lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden border-r border-border bg-canvas lg:block">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: PANEL_GLOW }}
        />
        <div className="relative flex h-full flex-col justify-between gap-12 p-10 xl:p-14">
          <LogoMark />
          <div className="max-w-md">
            <p className="text-4xl leading-[1.1] font-semibold tracking-[-0.035em] text-balance text-foreground xl:text-[2.5rem]">
              {headline}
            </p>
            <p className="mt-5 text-lg leading-relaxed text-pretty text-muted-foreground">
              {tagline}
            </p>
            <ul className="mt-10 space-y-3.5">
              {highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-[0.9375rem] font-medium text-foreground"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary">
                    <CheckIcon aria-hidden className="size-3.5" strokeWidth={2.5} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-muted-foreground tabular">© {year} Protected Assets</p>
        </div>
      </aside>

      <main className="flex flex-1 flex-col">
        <div className="px-4 pt-5 sm:px-6 sm:pt-6 lg:hidden">
          <LogoMark />
        </div>
        <div className="flex flex-1 items-start justify-center px-4 pt-12 pb-16 sm:items-center sm:px-6 sm:py-16 lg:px-12">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
