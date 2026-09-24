import { CheckIcon, LockIcon } from "lucide-react";

import { StatusMessage } from "@/components/app/status-message";
import { SubmitButton } from "@/components/app/submit-button";
import {
  SettingsGroup,
  SettingsRow,
  SettingsSaveBar,
  SwitchRow,
} from "@/components/settings/settings-group";
import { Field, describedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export type SettingsValues = {
  phone: string;
  notificationEmail: boolean;
  notificationSms: boolean;
};

export type SaveStatus =
  | { kind: "error"; message: string }
  | { kind: "success"; message: string }
  | { kind: "unsaved" }
  | null;

const EMAIL_HINT = "Your sign-in email can’t be changed.";
const PHONE_HINT =
  "Used for SMS alerts. Include your country code, e.g. +1 415 555 0123.";

function SaveStatusMessage({ status }: { status: NonNullable<SaveStatus> }) {
  if (status.kind === "error") {
    return (
      <StatusMessage status="error" className="px-3 py-2">
        {status.message}
      </StatusMessage>
    );
  }

  if (status.kind === "success") {
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium text-success">
        <CheckIcon className="size-4 shrink-0 animate-scale-in" aria-hidden />
        {status.message}
      </p>
    );
  }

  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary" />
      Unsaved changes
    </p>
  );
}

/**
 * Everything inside the settings `<form>`: presentational, so each save state
 * can be previewed without submitting. Field names are parsed by
 * `updateSettingsAction`; keep them in sync.
 */
export function ProfileSettingsFields({
  email,
  defaults,
  phoneMaxLength,
  phoneError,
  saveStatus,
}: {
  email: string;
  defaults: SettingsValues;
  phoneMaxLength: number;
  phoneError?: string;
  saveStatus: SaveStatus;
}) {
  return (
    <>
      <SettingsGroup id="settings-account" title="Account">
        <SettingsRow>
          <Field id="email" label="Email" hint={EMAIL_HINT}>
            <div className="relative sm:max-w-sm">
              <Input
                id="email"
                value={email}
                readOnly
                aria-describedby={describedBy("email", { hint: EMAIL_HINT })}
                className="cursor-default truncate bg-muted pr-9 text-muted-foreground shadow-none hover:border-input focus-visible:border-input"
              />
              <LockIcon
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-subtle-foreground"
              />
            </div>
          </Field>
        </SettingsRow>

        <SettingsRow>
          <Field
            id="phone"
            label="Phone number"
            optional
            hint={PHONE_HINT}
            error={phoneError}
          >
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={defaults.phone}
              placeholder="+1 415 555 0123"
              maxLength={phoneMaxLength}
              className="sm:max-w-sm"
              aria-invalid={Boolean(phoneError)}
              aria-describedby={describedBy("phone", {
                hint: PHONE_HINT,
                error: phoneError,
              })}
            />
          </Field>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup id="settings-notifications" title="Notifications">
        <SwitchRow
          id="notification_email"
          name="notification_email"
          title="Email alerts"
          description="Get an email for every new access request."
          defaultChecked={defaults.notificationEmail}
        />
        <SwitchRow
          id="notification_sms"
          name="notification_sms"
          title="SMS alerts"
          description="Get a text message for every new access request. Requires a phone number."
          defaultChecked={defaults.notificationSms}
        />
      </SettingsGroup>

      {/* Persistent, so the confirmation is announced when it appears. */}
      <p role="status" aria-live="polite" className="sr-only">
        {saveStatus?.kind === "success" ? saveStatus.message : ""}
      </p>

      <SettingsSaveBar
        status={saveStatus ? <SaveStatusMessage status={saveStatus} /> : null}
      >
        <SubmitButton pendingLabel="Saving…" className="w-full sm:w-auto">
          Save changes
        </SubmitButton>
      </SettingsSaveBar>
    </>
  );
}
