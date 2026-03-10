"use client";

import { useActionState } from "react";
import { UserIcon, BellIcon, PhoneIcon } from "lucide-react";

import type { SettingsFormState } from "@/app/dashboard/actions";
import { SubmitButton } from "@/components/app/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
                defaultValue={profile.phone ?? ""}
                placeholder="+1 415 555 0123"
                className="bg-white border-zinc-200"
              />
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

              {state.error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-100 text-sm text-red-600">
                  {state.error}
                </div>
              )}
              
              {state.success && (
                <div className="p-3 rounded-md bg-emerald-50 border border-emerald-100 text-sm text-emerald-600">
                  {state.success}
                </div>
              )}

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
