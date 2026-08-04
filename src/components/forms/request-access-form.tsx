"use client";

import { useActionState } from "react";
import { CheckCircle2Icon } from "lucide-react";

import type { RequestFormState } from "@/app/a/[slug]/actions";
import { StatusMessage } from "@/components/app/status-message";
import { SubmitButton } from "@/components/app/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IDLE_STATE } from "@/lib/action-state";
import { LIMITS } from "@/lib/validation";

export function RequestAccessForm({
  slug,
  action,
}: {
  slug: string;
  action: (
    state: RequestFormState,
    formData: FormData,
  ) => Promise<RequestFormState>;
}) {
  const [state, formAction] = useActionState(action, IDLE_STATE);
  const fieldErrors = state.fieldErrors ?? {};

  if (state.status === "success") {
    return (
      <div className="space-y-4 py-8 text-center" role="status" aria-live="polite">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2Icon className="size-6" aria-hidden />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-zinc-900">Request submitted</h3>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-zinc-600">
            {state.message} You will receive an email when your request is
            granted or denied.
          </p>
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-zinc-500">
            If you do not see it, check your spam folder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="slug" value={slug} />

      <div className="grid gap-2">
        <Label
          htmlFor="requester_name"
          className="text-sm font-medium text-zinc-700"
        >
          Name
        </Label>
        <Input
          id="requester_name"
          name="requester_name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          className="bg-zinc-50/50"
          maxLength={LIMITS.name}
          aria-invalid={Boolean(fieldErrors.requesterName)}
          aria-describedby={
            fieldErrors.requesterName ? "requester-name-error" : undefined
          }
          required
        />
        {fieldErrors.requesterName ? (
          <p id="requester-name-error" className="text-xs text-red-600">
            {fieldErrors.requesterName}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label
          htmlFor="requester_email"
          className="text-sm font-medium text-zinc-700"
        >
          Email
        </Label>
        <Input
          id="requester_email"
          name="requester_email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          className="bg-zinc-50/50"
          maxLength={LIMITS.email}
          aria-invalid={Boolean(fieldErrors.requesterEmail)}
          aria-describedby={
            fieldErrors.requesterEmail ? "requester-email-error" : undefined
          }
          required
        />
        {fieldErrors.requesterEmail ? (
          <p id="requester-email-error" className="text-xs text-red-600">
            {fieldErrors.requesterEmail}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="reason" className="text-sm font-medium text-zinc-700">
          Reason
        </Label>
        <Textarea
          id="reason"
          name="reason"
          rows={4}
          placeholder="Why do you need access?"
          className="resize-none bg-zinc-50/50"
          maxLength={LIMITS.reason}
          aria-invalid={Boolean(fieldErrors.reason)}
          aria-describedby={fieldErrors.reason ? "reason-error" : undefined}
          required
        />
        {fieldErrors.reason ? (
          <p id="reason-error" className="text-xs text-red-600">
            {fieldErrors.reason}
          </p>
        ) : null}
      </div>

      {state.status === "error" && state.message ? (
        <StatusMessage status="error">{state.message}</StatusMessage>
      ) : null}

      <SubmitButton
        className="h-10 w-full font-semibold shadow-sm"
        pendingLabel="Submitting..."
      >
        Request access
      </SubmitButton>
    </form>
  );
}
