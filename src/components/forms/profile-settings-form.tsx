"use client";

import { useActionState, useEffect, useState } from "react";

import {
  ProfileSettingsFields,
  type SaveStatus,
  type SettingsValues,
} from "@/components/settings/profile-settings-fields";
import { IDLE_STATE, type ActionState } from "@/lib/action-state";
import type { Profile } from "@/lib/types";

function readValues(form: HTMLFormElement): SettingsValues {
  const data = new FormData(form);
  const phone = data.get("phone");

  return {
    phone: typeof phone === "string" ? phone : "",
    notificationEmail: data.get("notification_email") === "on",
    notificationSms: data.get("notification_sms") === "on",
  };
}

/** The server trims the phone number, so surrounding spaces are not a change. */
function sameValues(a: SettingsValues, b: SettingsValues) {
  return (
    a.phone.trim() === b.phone.trim() &&
    a.notificationEmail === b.notificationEmail &&
    a.notificationSms === b.notificationSms
  );
}

/**
 * React resets a form after every action, failed ones included. The values
 * captured on submit become the controls' defaults, so that reset lands on
 * what the owner just entered rather than reverting their edits.
 *
 * `phoneMaxLength` comes from the server (`LIMITS.phone`): importing
 * `@/lib/validation` here would ship zod to the browser for one number.
 */
export function ProfileSettingsForm({
  action,
  profile,
  phoneMaxLength,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  profile: Profile;
  phoneMaxLength: number;
}) {
  const [state, formAction] = useActionState(action, IDLE_STATE);
  /** Last submitted values: the defaults the post-action reset restores. */
  const [submitted, setSubmitted] = useState<SettingsValues | null>(null);
  /** Live values since the last submit; null until something is edited. */
  const [edited, setEdited] = useState<SettingsValues | null>(null);

  const persisted: SettingsValues = {
    phone: profile.phone ?? "",
    notificationEmail: profile.notification_email,
    notificationSms: profile.notification_sms,
  };
  const defaults = submitted ?? persisted;
  const phoneError = state.fieldErrors?.phone;

  useEffect(() => {
    if (state.status === "error" && state.fieldErrors?.phone) {
      document.getElementById("phone")?.focus();
    }
  }, [state]);

  // The outcome of the last save stays up until the next edit. A phone error
  // is already shown under the field, so it is not repeated here.
  const untouchedSinceSubmit = edited === null;
  let saveStatus: SaveStatus = null;

  if (
    untouchedSinceSubmit &&
    state.status === "error" &&
    state.message &&
    state.message !== phoneError
  ) {
    saveStatus = { kind: "error", message: state.message };
  } else if (untouchedSinceSubmit && state.status === "success") {
    saveStatus = {
      kind: "success",
      message: state.message || "Settings updated.",
    };
  } else if (!sameValues(edited ?? defaults, persisted)) {
    saveStatus = { kind: "unsaved" };
  }

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        setSubmitted(readValues(event.currentTarget));
        setEdited(null);
      }}
      onChange={(event) => setEdited(readValues(event.currentTarget))}
      className="space-y-8"
    >
      <ProfileSettingsFields
        email={profile.email}
        defaults={defaults}
        phoneMaxLength={phoneMaxLength}
        phoneError={phoneError}
        saveStatus={saveStatus}
      />
    </form>
  );
}
