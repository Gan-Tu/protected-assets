import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon, Trash2Icon } from "lucide-react";

import {
  clearRequestHistoryAction,
  deleteAssetAction,
  upsertAssetAction,
} from "@/app/dashboard/actions";
import { ConfirmSubmitButton } from "@/components/app/confirm-submit-button";
import { Badge } from "@/components/ui/badge";
import { AssetForm } from "@/components/forms/asset-form";
import { RequestHistoryRow } from "@/components/dashboard/request-history-row";
import { getAssetForEditor, getDashboardData, requireOwner } from "@/lib/data";
import type { AccessRequestStatus } from "@/lib/types";

export default async function EditAssetPage({
  params,
  searchParams,
}: {
  params: Promise<{ assetId: string }>;
  searchParams: Promise<{ history_limit?: string }>;
}) {
  const owner = await requireOwner();
  const { assetId } = await params;
  const { history_limit } = await searchParams;

  const data = await Promise.all([
    getDashboardData(owner.id),
    getAssetForEditor(owner.id, assetId),
  ]).catch(() => null);

  if (!data) {
    notFound();
  }

  const [{ groups }, { asset, links, files, requests }] = data;
  const deleteFormId = `delete-asset-${asset.id}`;
  const clearHistoryFormId = `clear-request-history-${asset.id}`;

  const allProcessed = requests.filter((request) => request.status !== "pending");
  const limit = history_limit === "all" ? allProcessed.length : 10;
  const processedRequests = allProcessed.slice(0, limit);
  const hasMoreHistory = allProcessed.length > limit;

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-6">
      <header className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ChevronLeftIcon className="size-4" />
            Back to dashboard
          </Link>

          <form id={deleteFormId} action={deleteAssetAction}>
            <input type="hidden" name="asset_id" value={asset.id} />
            <ConfirmSubmitButton
              formId={deleteFormId}
              triggerLabel="Delete Asset"
              title="Delete this asset?"
              description="This removes the asset and any associated stored files. This action cannot be undone."
              confirmLabel="Delete"
              triggerVariant="outline"
              triggerClassName="h-9 px-4 text-xs font-bold uppercase tracking-wider text-red-600 border-red-100 bg-red-50/50 hover:bg-red-50 hover:text-red-700 transition-colors"
              icon={<Trash2Icon className="size-3.5 mr-1.5" />}
            />
          </form>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950">{asset.name}</h1>
            {links.length ? (
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider h-5 border-zinc-200 text-zinc-500">
                {links.length} {links.length === 1 ? "Link" : "Links"}
              </Badge>
            ) : null}
            {files.length ? (
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider h-5 border-zinc-200 text-zinc-500">
                {files.length} {files.length === 1 ? "File" : "Files"}
              </Badge>
            ) : null}
            <Badge className="text-[10px] font-bold uppercase tracking-wider h-5 bg-zinc-100 text-zinc-600 border-none">
              {requests.length} Requests
            </Badge>
          </div>
          <p className="text-base text-zinc-500 max-w-2xl leading-relaxed">
            Update settings, rotate the share slug, or adjust the release policy.
          </p>
        </div>
      </header>

      <div className="pt-8 border-t border-zinc-100">
        <AssetForm action={upsertAssetAction} groups={groups} asset={asset} links={links} files={files} />
      </div>

      {processedRequests.length > 0 && (
        <section className="pt-12 border-t border-zinc-100 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Request History</h2>
              <p className="text-sm text-zinc-500">The most recent approvals and denials for this asset.</p>
            </div>
            <form id={clearHistoryFormId} action={clearRequestHistoryAction}>
              <input type="hidden" name="asset_id" value={asset.id} />
              <input type="hidden" name="redirect_to" value={`/dashboard/assets/${asset.id}`} />
              <ConfirmSubmitButton
                formId={clearHistoryFormId}
                triggerLabel="Clear History"
                title="Clear this asset history?"
                description="This removes all approved, auto-approved, and denied requests for this asset."
                confirmLabel="Clear history"
                triggerVariant="outline"
                triggerClassName="h-9 px-4 text-xs font-bold uppercase tracking-wider text-zinc-500 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
                icon={<Trash2Icon className="size-3.5 mr-1.5" />}
              />
            </form>
          </div>
          <div className="space-y-3">
            {processedRequests.map((request) => (
              <RequestHistoryRow
                key={request.id}
                requesterEmail={request.requester_email}
                reason={request.reason}
                decisionNote={request.decision_note}
                status={request.status as AccessRequestStatus}
                createdAt={request.created_at}
                processedAt={request.released_at || request.denied_at}
              />
            ))}
            {hasMoreHistory && (
              <div className="pt-2 text-center">
                <Link 
                  href={`/dashboard/assets/${asset.id}?history_limit=all`}
                  className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  Show more history
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
