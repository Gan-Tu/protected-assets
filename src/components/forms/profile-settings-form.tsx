"use client";

import { useActionState } from "react";
import { UserIcon, BellIcon, PhoneIcon } from "lucide-react";

import { StatusMessage } from "@/components/app/status-message";
import { SubmitButton } from "@/components/app/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IDLE_STATE, type ActionState } from "@/lib/action-state";
import type { Profile } from "@/lib/types";
import { LIMITS } from "@/lib/validation";

export function ProfileSettingsForm({
  action,
  profile,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  profile: Profile;
}) {
  const [state, formAction] = useActionState(action, IDLE_STATE);
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-zinc-900">Account Settings</h2>
        <p className="text-sm text-zinc-500">Manage your profile and notification preferences.</p>
      </div>

      <form action={formAction} className="space-y-8">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <UserIcon className="size-3.5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-zinc-600 text-xs font-bold uppercase tracking-wider">Email Address</Label>
              <Input id="email" value={profile.email} disabled className="bg-zinc-50 border-zinc-200 text-zinc-500 cursor-not-allowed" />
              <p className="text-[10px] text-zinc-400">Account email cannot be changed.</p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-zinc-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <PhoneIcon className="size-3" />
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                defaultValue={profile.phone ?? ""}
                placeholder="+1 415 555 0123"
                maxLength={LIMITS.phone}
                className="bg-white border-zinc-200"
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
              />
              {fieldErrors.phone ? (
                <p id="phone-error" className="text-xs text-red-600">
                  {fieldErrors.phone}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <BellIcon className="size-3.5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="notification_email"
                    defaultChecked={profile.notification_email}
                    className="mt-1 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                  />
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium text-zinc-900 group-hover:text-zinc-700 transition-colors">Email Alerts</span>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Receive an email for every new access request.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="notification_sms"
                    defaultChecked={profile.notification_sms}
                    className="mt-1 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                  />
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium text-zinc-900 group-hover:text-zinc-700 transition-colors">SMS Alerts</span>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Get text notifications on your phone (requires Twilio).
                    </p>
                  </div>
                </label>
              </div>

              {state.status === "error" && state.message ? (
                <StatusMessage status="error">{state.message}</StatusMessage>
              ) : null}

              {state.status === "success" && state.message ? (
                <StatusMessage status="success">{state.message}</StatusMessage>
              ) : null}

              <div className="pt-4 border-t border-zinc-100">
                <SubmitButton className="w-full sm:w-auto font-bold shadow-sm" pendingLabel="Saving...">
                  Save Changes
                </SubmitButton>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
