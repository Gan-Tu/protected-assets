import type { Metadata } from "next";

import { updateSettingsAction } from "@/app/dashboard/actions";
import { PageHeader } from "@/components/app/page-header";
import { ProfileSettingsForm } from "@/components/forms/profile-settings-form";
import { requireOwner } from "@/lib/auth";
import { getOwnerProfile } from "@/lib/repos/profiles";
import { LIMITS } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Settings | Protected Assets",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const owner = await requireOwner();
  const profile = await getOwnerProfile(owner.id, owner.email);

  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader
        title="Settings"
        description="Your account and how we notify you about new requests."
      />
      <ProfileSettingsForm
        action={updateSettingsAction}
        profile={profile}
        phoneMaxLength={LIMITS.phone}
      />
    </div>
  );
}
