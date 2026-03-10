"use client";

import { useActionState } from "react";

import type { RequestFormState } from "@/app/a/[slug]/actions";
import { SubmitButton } from "@/components/app/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: RequestFormState = {};

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
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <div className="space-y-2">
        <Label htmlFor="requester_email">Your email</Label>
        <Input
          id="requester_email"
          name="requester_email"
          type="email"
          placeholder="you@company.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reason">Reason for access</Label>
        <Textarea
          id="reason"
          name="reason"
          rows={5}
          placeholder="Tell the owner who you are, why you need access, and any timeline context."
          required
        />
      </div>
      {state.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}
      <SubmitButton className="w-full justify-center" pendingLabel="Submitting request...">
        Request access
      </SubmitButton>
    </form>
  );
}
