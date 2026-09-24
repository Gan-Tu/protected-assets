import type { Metadata } from "next";

import { upsertAssetAction } from "@/app/dashboard/actions";
import { PageHeader } from "@/components/app/page-header";
import { BackLink } from "@/components/asset-editor/back-link";
import { AssetForm } from "@/components/forms/asset-form";
import { requireOwner } from "@/lib/auth";
import { getAssetGroups } from "@/lib/services/assets";
import { getBaseUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "New asset | Protected Assets",
  robots: { index: false, follow: false },
};

export default async function NewAssetPage() {
  const owner = await requireOwner();
  // Only the collections dropdown is needed here; this used to load the whole
  // dashboard (every asset, file, link and request) to render one <select>.
  const groups = await getAssetGroups(owner.id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={<BackLink />}
        title="New asset"
        description="Protect links and files behind a request. Share one link."
      />

      <AssetForm
        action={upsertAssetAction}
        groups={groups}
        shareBaseUrl={getBaseUrl()}
        cancelHref="/dashboard"
      />
    </div>
  );
}
