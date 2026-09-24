"use client";

import { useEffect, useRef } from "react";
import { CheckIcon, MailIcon } from "lucide-react";

/**
 * Replaces the form once a request is in. Focus moves to the heading so
 * keyboard and screen-reader users land on the result (the button they pressed
 * no longer exists), and the heading's description carries the details.
 */
export function RequestAccessSuccess({
  message,
  autoFocus = true,
}: {
  message?: string;
  autoFocus?: boolean;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (autoFocus) headingRef.current?.focus();
  }, [autoFocus]);

  return (
    <div className="flex flex-col items-center px-6 py-6 text-center sm:px-10 sm:py-10">
      <div className="flex size-14 animate-scale-in items-center justify-center rounded-full bg-success-subtle text-success ring-8 ring-success-subtle/50">
        <CheckIcon className="size-7" strokeWidth={2.5} aria-hidden />
      </div>

      <div className="mt-6 animate-fade-up space-y-2 [animation-delay:80ms]">
        <h2
          ref={headingRef}
          tabIndex={-1}
          aria-describedby="request-success-message request-success-next"
          className="text-xl leading-7 font-semibold tracking-tight text-foreground outline-none"
        >
          Request sent
        </h2>
        {message ? (
          <p
            id="request-success-message"
            className="mx-auto max-w-sm text-[0.9375rem] leading-relaxed break-words text-pretty text-foreground"
          >
            {message}
          </p>
        ) : null}
        <p
          id="request-success-next"
          className="mx-auto max-w-sm text-sm leading-relaxed text-pretty text-muted-foreground"
        >
          You’ll get an email when the owner responds.
        </p>
      </div>

      <p className="mt-6 flex w-full animate-fade-up items-center justify-center gap-2 border-t border-border pt-5 text-[0.8125rem] leading-5 text-muted-foreground [animation-delay:160ms]">
        <MailIcon className="size-3.5 shrink-0 text-subtle-foreground" aria-hidden />
        Don’t see it? Check your spam folder.
      </p>
    </div>
  );
}
