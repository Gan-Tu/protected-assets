"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { CheckIcon, CircleAlertIcon } from "lucide-react";

import { SubmitButton } from "@/components/app/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/**
 * Floating action bar that stays in thumb/cursor reach for the whole form and
 * settles at the form's end. It sits on `glass`, so every piece of text is
 * ink or nav-foreground (never secondary gray) to hold contrast over anything
 * that scrolls beneath it.
 */
export function SaveBar({
  mode,
  cancelHref,
  uploadingCount,
  error = null,
  dirty,
}: {
  mode: "new" | "edit";
  cancelHref: string;
  uploadingCount: number;
  /** `fields`: inline field errors; `form`: only the message above the bar. */
  error?: "fields" | "form" | null;
  dirty: boolean;
}) {
  const { pending } = useFormStatus();
  const isUploading = uploadingCount > 0;

  let tone: "busy" | "error" | "dirty" | "saved" | "idle" = "idle";
  let message = "Nothing is shared until you create the asset.";

  if (pending) {
    tone = "busy";
    message = mode === "new" ? "Creating…" : "Saving…";
  } else if (isUploading) {
    tone = "busy";
    message = `Uploading ${uploadingCount} ${uploadingCount === 1 ? "file" : "files"}…`;
  } else if (error) {
    tone = "error";
    message =
      error === "fields"
        ? "Couldn’t save. Check the highlighted fields."
        : "Couldn’t save. See the message above.";
  } else if (mode === "edit") {
    tone = dirty ? "dirty" : "saved";
    message = dirty ? "Unsaved changes" : "All changes saved";
  }

  return (
    <div className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 mt-6 sm:bottom-4">
      <div className="glass flex flex-col gap-2.5 rounded-2xl border border-border p-2.5 shadow-lg sm:flex-row sm:items-center sm:gap-4 sm:py-2.5 sm:pr-2.5 sm:pl-4">
        <p
          aria-live="polite"
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 px-1.5 text-sm leading-5 text-nav-foreground sm:px-0",
            // Phones only get the line when it says something actionable.
            (tone === "idle" || tone === "saved") && "max-sm:hidden",
          )}
        >
          {tone === "busy" ? <Spinner className="size-3.5 shrink-0" /> : null}
          {tone === "error" ? (
            <CircleAlertIcon className="size-4 shrink-0 text-danger" aria-hidden />
          ) : null}
          {tone === "dirty" ? (
            <span aria-hidden className="size-2 shrink-0 rounded-full bg-warning" />
          ) : null}
          {tone === "saved" ? (
            <CheckIcon className="size-4 shrink-0" aria-hidden />
          ) : null}
          <span className="min-w-0 truncate">{message}</span>
        </p>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:items-center">
          <Link
            href={cancelHref}
            className={cn(buttonVariants({ variant: "outline" }), "h-10 sm:h-9")}
          >
            Cancel
          </Link>
          <SubmitButton
            pendingLabel={mode === "new" ? "Creating…" : "Saving…"}
            disabled={isUploading}
            className="h-10 sm:h-9"
          >
            {mode === "new" ? "Create asset" : "Save changes"}
          </SubmitButton>
        </div>
      </div>
    </div>
  );
}
