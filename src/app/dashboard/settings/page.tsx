import { updateSettingsAction } from "@/app/dashboard/actions";
import { ProfileSettingsForm } from "@/components/forms/profile-settings-form";
import { getOwnerProfile, requireOwner } from "@/lib/data";

export default async function SettingsPage() {
  const owner = await requireOwner();
  const profile = await getOwnerProfile(owner.id);

  return (
    <div className="space-y-6">
      <ProfileSettingsForm action={updateSettingsAction} profile={profile} />
    </div>
  );
}
