"use client";

import { startTransition, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type SaveSuccessToastProps = {
  open: boolean;
  message?: string;
  /** Lift the toast clear of a floating bottom bar (e.g. the editor's save bar). */
  placement?: "bottom" | "above-bar";
};

/**
 * Dark "HUD" toast, bottom-centre: reachable by thumb on phones and out of the
 * way of page headers on desktop. White on ink is 16:1, so it reads over any
 * content it floats above.
 */
export function SaveSuccessToast({
  open,
  message = "Changes saved",
  placement = "bottom",
}: SaveSuccessToastProps) {
  const [visible, setVisible] = useState(open);
  const [lastOpen, setLastOpen] = useState(open);

  // Re-show when `open` flips back on without a remount (e.g. a second save
  // on the same page), using React's "adjust state during render" pattern.
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setVisible(true);
  }
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!open) return;

    const params = new URLSearchParams(searchParams.toString());
    if (params.get("saved") === "1") {
      params.delete("saved");
      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    }
  }, [open, pathname, router, searchParams]);

  useEffect(() => {
    if (!visible) return;

    const timeoutId = window.setTimeout(() => {
      setVisible(false);
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4",
        placement === "above-bar"
          ? "bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.5rem)] sm:bottom-[5.25rem]"
          : "bottom-[max(1.25rem,env(safe-area-inset-bottom))]",
      )}
    >
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex animate-toast-in items-center gap-3 rounded-full bg-[#1d1d1f] py-2 pr-2 pl-3 text-sm text-white shadow-xl ring-1 ring-white/10"
      >
        <span className="flex size-5 items-center justify-center rounded-full bg-[#30d158] text-[#0b3d1a]">
          <CheckIcon className="size-3.5" strokeWidth={3} aria-hidden />
        </span>
        <p className="font-medium">{message}</p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-[#d8d8dc] transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Dismiss"
        >
          <XIcon className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
