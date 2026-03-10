"use client";

import { useActionState } from "react";

import type { SettingsFormState } from "@/app/dashboard/actions";
import { SubmitButton } from "@/components/app/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/lib/types";

const initialState: SettingsFormState = {};

export function ProfileSettingsForm({
  action,
  profile,
}: {
  action: (
    state: SettingsFormState,
    formData: FormData,
  ) => Promise<SettingsFormState>;
  profile: Profile;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <Card className="border-white/60 bg-white/92 py-5 shadow-[0_30px_70px_rgba(15,23,42,0.08)]">
      <CardHeader>
        <CardTitle className="text-xl tracking-tight text-slate-950">Account settings</CardTitle>
        <CardDescription className="text-sm text-slate-600">
          Manage your notification channels and fallback phone number.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Account email</Label>
            <Input id="email" value={profile.email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={profile.phone ?? ""}
              placeholder="+1 415 555 0123"
            />
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4">
            <input
              type="checkbox"
              name="notification_email"
              defaultChecked={profile.notification_email}
              className="mt-0.5 accent-slate-950"
            />
            <span>
              <span className="block text-sm font-medium text-slate-950">Email notifications</span>
              <span className="block text-sm text-slate-600">
                Notify me when someone requests access.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4">
            <input
              type="checkbox"
              name="notification_sms"
              defaultChecked={profile.notification_sms}
              className="mt-0.5 accent-slate-950"
            />
            <span>
              <span className="block text-sm font-medium text-slate-950">SMS notifications</span>
              <span className="block text-sm text-slate-600">
                Requires `TWILIO_*` env vars and a valid phone number.
              </span>
            </span>
          </label>
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
          <SubmitButton pendingLabel="Saving settings...">Save settings</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
