import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { upsertAssetAction } from "@/app/dashboard/actions";
import { AssetForm } from "@/components/forms/asset-form";
import { getDashboardData, requireOwner } from "@/lib/data";

export const metadata: Metadata = {
  title: "New Asset | Protected Assets",
};

export default async function NewAssetPage() {
  const owner = await requireOwner();
  const { groups } = await getDashboardData(owner.id);

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-6">
      <header className="space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ChevronLeftIcon className="size-4" />
          Back to dashboard
        </Link>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">New Protected Asset</h1>
          <p className="text-base text-zinc-500 leading-relaxed">
            Create a private link or document bundle for your next release.
          </p>
        </div>
      </header>

      <div className="pt-8 border-t border-zinc-100">
        <AssetForm action={upsertAssetAction} groups={groups} />
      </div>
    </div>
  );
}
