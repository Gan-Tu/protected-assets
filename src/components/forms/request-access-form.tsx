"use client";

import { useActionState } from "react";
import { CheckCircle2Icon, AlertCircleIcon } from "lucide-react";

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

  if (state.success) {
    return (
      <div className="py-8 text-center space-y-4">
        <div className="mx-auto size-12 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2Icon className="size-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-zinc-900">Request Submitted</h3>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto">
            {state.success}. You will receive an email once the owner reviews your request.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="slug" value={slug} />
      <div className="grid gap-2">
        <Label htmlFor="requester_email" className="text-zinc-700 text-sm font-medium">Email</Label>
        <Input
          id="requester_email"
          name="requester_email"
          type="email"
          placeholder="name@example.com"
          className="bg-zinc-50/50"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="reason" className="text-zinc-700 text-sm font-medium">Reason</Label>
        <Textarea
          id="reason"
          name="reason"
          rows={4}
          placeholder="Why do you need access?"
          className="bg-zinc-50/50 resize-none"
          required
        />
      </div>
      
      {state.error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-100 text-sm text-red-600">
          <AlertCircleIcon className="size-4 shrink-0" />
          <p>{state.error}</p>
        </div>
      )}

      <SubmitButton className="w-full h-10 font-semibold shadow-sm" pendingLabel="Submitting...">
        Request Access
      </SubmitButton>
    </form>
  );
}
