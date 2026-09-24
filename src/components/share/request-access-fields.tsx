"use client";

import { useState } from "react";
import { LockIcon } from "lucide-react";

import { StatusMessage } from "@/components/app/status-message";
import { SubmitButton } from "@/components/app/submit-button";
import { Field, describedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * `LIMITS` from `@/lib/validation`, passed in by the server rather than
 * imported: that module pulls zod into any client bundle that touches it, and
 * this is the public page.
 */
export type RequestLimits = { name: number; email: number; reason: number };

/** What the requester last submitted, restored after a failed attempt. */
export type RequestDraft = { name: string; email: string; reason: string };

export const REQUEST_FIELD_IDS = {
  requesterName: "requester_name",
  requesterEmail: "requester_email",
  reason: "reason",
} as const;

const count = new Intl.NumberFormat("en-US");

/**
 * The request form's controls, submit button and privacy note. Presentational
 * apart from the character counter, so the error states can be previewed
 * without submitting anything.
 */
export function RequestAccessFields({
  limits,
  fieldErrors = {},
  formError,
  draft,
}: {
  limits: RequestLimits;
  fieldErrors?: Record<string, string>;
  /** A failure that is not already shown next to a field. */
  formError?: string;
  draft?: RequestDraft | null;
}) {
  const [reasonLength, setReasonLength] = useState(draft?.reason.length ?? 0);

  const nameError = fieldErrors.requesterName;
  const emailError = fieldErrors.requesterEmail;
  const reasonError = fieldErrors.reason;
  const nearLimit = reasonLength >= limits.reason * 0.9;

  return (
    <div className="grid gap-5">
      <Field id="requester_name" label="Name" error={nameError}>
        <Input
          id="requester_name"
          name="requester_name"
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          placeholder="Jane Appleseed"
          maxLength={limits.name}
          defaultValue={draft?.name}
          aria-invalid={Boolean(nameError)}
          aria-describedby={describedBy("requester_name", { error: nameError })}
          required
        />
      </Field>

      <Field id="requester_email" label="Email" error={emailError}>
        <Input
          id="requester_email"
          name="requester_email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          placeholder="you@example.com"
          maxLength={limits.email}
          defaultValue={draft?.email}
          aria-invalid={Boolean(emailError)}
          aria-describedby={describedBy("requester_email", {
            error: emailError,
          })}
          required
        />
      </Field>

      <Field
        id="reason"
        label="Why do you need access?"
        error={reasonError}
        action={
          <span
            id="reason-count"
            className={cn(
              "text-xs tabular transition-colors duration-150 ease-out-soft",
              nearLimit ? "font-medium text-warning" : "text-muted-foreground",
            )}
          >
            <span aria-hidden>
              {count.format(reasonLength)} / {count.format(limits.reason)}
            </span>
            <span className="sr-only">
              {reasonLength} of {limits.reason} characters used
            </span>
          </span>
        }
      >
        <Textarea
          id="reason"
          name="reason"
          rows={4}
          placeholder="A sentence or two helps the owner decide."
          className="max-h-60 min-h-28 resize-none"
          maxLength={limits.reason}
          defaultValue={draft?.reason}
          onChange={(event) => setReasonLength(event.currentTarget.value.length)}
          aria-invalid={Boolean(reasonError)}
          aria-describedby={[
            describedBy("reason", { error: reasonError }),
            "reason-count",
          ]
            .filter(Boolean)
            .join(" ")}
          required
        />
      </Field>

      {formError ? (
        <StatusMessage status="error">{formError}</StatusMessage>
      ) : null}

      <div className="grid gap-3 pt-1">
        <SubmitButton
          size="lg"
          className="w-full"
          pendingLabel="Sending request…"
        >
          Request access
        </SubmitButton>
        <p className="flex items-start justify-center gap-1.5 text-center text-[0.8125rem] leading-5 text-muted-foreground">
          <LockIcon
            className="mt-[3px] size-3.5 shrink-0 text-subtle-foreground"
            aria-hidden
          />
          Only the owner of this asset sees your request.
        </p>
      </div>
    </div>
  );
}
