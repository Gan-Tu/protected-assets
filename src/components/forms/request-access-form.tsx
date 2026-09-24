"use client";

import { useActionState, useEffect, useState } from "react";

import type { RequestFormState } from "@/app/a/[slug]/actions";
import {
  REQUEST_ACCESS_TITLE_ID,
  RequestAccessBody,
  RequestAccessCard,
  RequestAccessHeader,
} from "@/components/share/request-access-card";
import {
  REQUEST_FIELD_IDS,
  RequestAccessFields,
  type RequestDraft,
  type RequestLimits,
} from "@/components/share/request-access-fields";
import { RequestAccessSuccess } from "@/components/share/request-access-success";
import { IDLE_STATE } from "@/lib/action-state";

const FIELD_KEYS = Object.keys(REQUEST_FIELD_IDS) as Array<
  keyof typeof REQUEST_FIELD_IDS
>;

function readDraft(form: HTMLFormElement): RequestDraft {
  const data = new FormData(form);
  const read = (key: string) => {
    const value = data.get(key);
    return typeof value === "string" ? value : "";
  };

  return {
    name: read("requester_name"),
    email: read("requester_email"),
    reason: read("reason"),
  };
}

/**
 * The server action is passed straight to `useActionState`, so the form still
 * posts (and renders the result) before hydration.
 *
 * React resets a form after every action, failed ones included. The draft
 * captured on submit becomes the fields' default values, so the reset restores
 * what the requester typed instead of wiping it.
 */
export function RequestAccessForm({
  slug,
  action,
  limits,
  className,
}: {
  slug: string;
  action: (
    state: RequestFormState,
    formData: FormData,
  ) => Promise<RequestFormState>;
  limits: RequestLimits;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, IDLE_STATE);
  const [draft, setDraft] = useState<RequestDraft | null>(null);
  const fieldErrors = state.fieldErrors ?? {};

  // Like native validation: take the requester to the first field to fix. Its
  // error is read out through `aria-describedby`.
  useEffect(() => {
    if (state.status !== "error") return;

    const firstInvalid = FIELD_KEYS.find((key) => state.fieldErrors?.[key]);
    if (firstInvalid) {
      document.getElementById(REQUEST_FIELD_IDS[firstInvalid])?.focus();
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <RequestAccessCard className={className}>
        <RequestAccessSuccess message={state.message} />
      </RequestAccessCard>
    );
  }

  // Field errors render inline; only show the banner for anything else
  // (rate limits, delivery failures) so the same sentence never appears twice.
  const inlineErrors = FIELD_KEYS.map((key) => fieldErrors[key]);
  const formError =
    state.status === "error" &&
    state.message &&
    !inlineErrors.includes(state.message)
      ? state.message
      : undefined;

  return (
    <RequestAccessCard className={className}>
      <RequestAccessHeader />
      <RequestAccessBody>
        <form
          action={formAction}
          onSubmit={(event) => setDraft(readDraft(event.currentTarget))}
          aria-labelledby={REQUEST_ACCESS_TITLE_ID}
        >
          <input type="hidden" name="slug" value={slug} />
          <RequestAccessFields
            limits={limits}
            fieldErrors={fieldErrors}
            formError={formError}
            draft={draft}
          />
        </form>
      </RequestAccessBody>
    </RequestAccessCard>
  );
}
