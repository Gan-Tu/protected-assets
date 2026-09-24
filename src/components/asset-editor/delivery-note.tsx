import { LinkIcon, PaperclipIcon, ShieldCheckIcon } from "lucide-react";

import {
  DOWNLOAD_LINK_TTL_SECONDS,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/constants";
import { compactFileSize, formatRelativeWindow } from "@/lib/utils";

// Derived from the same constants delivery uses, so the copy can't drift.
const ATTACHMENT_BUDGET = compactFileSize(MAX_ATTACHMENT_BYTES);
const LINK_LIFETIME = formatRelativeWindow(DOWNLOAD_LINK_TTL_SECONDS, {
  verbose: true,
});

/** Secondary, read-only explainer: outlined on the canvas rather than a white card. */
export function DeliveryNote() {
  return (
    <section
      aria-labelledby="delivery-heading"
      className="rounded-2xl border border-border px-5 py-4"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-card shadow-xs">
          <ShieldCheckIcon className="size-3.5 text-subtle-foreground" aria-hidden />
        </span>
        <h2
          id="delivery-heading"
          className="text-sm leading-5 font-semibold tracking-tight text-foreground"
        >
          How delivery works
        </h2>
      </div>

      <ul className="mt-3 grid gap-2.5 text-[0.8125rem] leading-5 text-muted-foreground">
        <li className="flex gap-2.5">
          <PaperclipIcon
            className="mt-0.5 size-3.5 shrink-0 text-subtle-foreground"
            aria-hidden
          />
          <span className="text-pretty">
            Documents and images up to {ATTACHMENT_BUDGET} in total are attached
            to the email.
          </span>
        </li>
        <li className="flex gap-2.5">
          <LinkIcon
            className="mt-0.5 size-3.5 shrink-0 text-subtle-foreground"
            aria-hidden
          />
          <span className="text-pretty">
            Anything else arrives as a download link. It expires after{" "}
            {LINK_LIFETIME}, or as soon as you clear the request.
          </span>
        </li>
      </ul>
    </section>
  );
}
