import type { Metadata } from "next";

import { updateSettingsAction } from "@/app/dashboard/actions";
import { ProfileSettingsForm } from "@/components/forms/profile-settings-form";
import { requireOwner } from "@/lib/auth";
import { getOwnerProfile } from "@/lib/repos/profiles";

export const metadata: Metadata = {
  title: "Settings | Protected Assets",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const owner = await requireOwner();
  const profile = await getOwnerProfile(owner.id, owner.email);

  return (
    <div className="space-y-6">
      <ProfileSettingsForm action={updateSettingsAction} profile={profile} />
    </div>
  );
}
