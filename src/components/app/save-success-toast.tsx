"use client";

import { startTransition, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2Icon, XIcon } from "lucide-react";

type SaveSuccessToastProps = {
  open: boolean;
  message?: string;
};

export function SaveSuccessToast({
  open,
  message = "Changes saved successfully.",
}: SaveSuccessToastProps) {
  const [visible, setVisible] = useState(open);
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
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50">
      <div className="pointer-events-auto flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 shadow-lg shadow-emerald-100/60">
        <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
        <p className="font-medium leading-relaxed">{message}</p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="inline-flex cursor-pointer items-center justify-center rounded-md p-1 text-emerald-700 transition hover:bg-emerald-100 hover:text-emerald-900"
          aria-label="Dismiss success message"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
