import Link from "next/link";

import { LogoGlyph } from "@/components/app/logo-mark";
import { getMarketingLinks } from "@/components/marketing/site-header";

const footerLinkClass =
  "inline-flex h-8 items-center rounded-md text-muted-foreground outline-none transition-colors duration-150 ease-out-soft hover:text-foreground focus-visible:ring-4 focus-visible:ring-primary/25";

export function SiteFooter({ signedIn }: { signedIn: boolean }) {
  const links = getMarketingLinks(signedIn);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2.5">
          <LogoGlyph className="size-5 text-foreground" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Protected Assets</span>
            <span className="tabular"> © {year}</span>
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex items-center gap-6 text-sm">
            <li>
              <Link href={links.secondary.href} className={footerLinkClass}>
                {links.secondary.label}
              </Link>
            </li>
            <li>
              <Link href={links.primary.href} className={footerLinkClass}>
                {links.primary.label}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
