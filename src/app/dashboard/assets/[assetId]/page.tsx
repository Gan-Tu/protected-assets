import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeftIcon, Trash2Icon } from "lucide-react";

import { deleteAssetAction, upsertAssetAction } from "@/app/dashboard/actions";
import { ConfirmSubmitButton } from "@/components/app/confirm-submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AssetForm } from "@/components/forms/asset-form";
import { getAssetForEditor, getDashboardData, requireOwner } from "@/lib/data";

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const owner = await requireOwner();
  const { assetId } = await params;

  const data = await Promise.all([
    getDashboardData(owner.id),
    getAssetForEditor(owner.id, assetId),
  ]).catch(() => null);

  if (!data) {
    notFound();
  }

  const [{ groups }, { asset, files, requests }] = data;
  const deleteFormId = `delete-asset-${asset.id}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeftIcon className="size-4" />
          Back to dashboard
        </Link>
        <form id={deleteFormId} action={deleteAssetAction}>
          <input type="hidden" name="asset_id" value={asset.id} />
          <ConfirmSubmitButton
            formId={deleteFormId}
            triggerLabel="Delete asset"
            title="Delete this asset?"
            description="This removes the asset and any associated stored files. Existing share links will stop working."
            confirmLabel="Delete asset"
            triggerVariant="outline"
            triggerClassName="rounded-full border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
            icon={<Trash2Icon className="size-4" />}
          />
        </form>
      </div>
      <Card className="border-white/60 bg-white/92 py-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full border-slate-200">
              {asset.kind === "link" ? "Link asset" : "Document bundle"}
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              {requests.length} total requests
            </Badge>
          </div>
          <CardTitle className="text-2xl tracking-tight text-slate-950">{asset.name}</CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Update settings, rotate the share slug, or adjust the release policy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AssetForm action={upsertAssetAction} groups={groups} asset={asset} files={files} />
        </CardContent>
      </Card>
    </div>
  );
}
