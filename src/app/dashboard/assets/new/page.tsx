import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { upsertAssetAction } from "@/app/dashboard/actions";
import { AssetForm } from "@/components/forms/asset-form";
import { requireOwner } from "@/lib/auth";
import { getAssetGroups } from "@/lib/services/assets";

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
    <div className="mx-auto max-w-5xl space-y-12 py-6">
      <header className="space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
        >
          <ChevronLeftIcon className="size-4" aria-hidden />
          Back to dashboard
        </Link>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
            New protected asset
          </h1>
          <p className="text-base leading-relaxed text-zinc-500">
            Create a private link or document bundle for your next release.
          </p>
        </div>
      </header>

      <div className="border-t border-zinc-100 pt-8">
        <AssetForm action={upsertAssetAction} groups={groups} />
      </div>
    </div>
  );
}
