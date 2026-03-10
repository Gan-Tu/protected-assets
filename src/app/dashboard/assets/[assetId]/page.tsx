import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon, ExternalLinkIcon, Trash2Icon } from "lucide-react";

import {
  clearRequestHistoryAction,
  deleteAssetAction,
  upsertAssetAction,
} from "@/app/dashboard/actions";
import { ConfirmSubmitButton } from "@/components/app/confirm-submit-button";
import { SaveSuccessToast } from "@/components/app/save-success-toast";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { AssetForm } from "@/components/forms/asset-form";
import { RequestHistoryRow } from "@/components/dashboard/request-history-row";
import { getAssetForEditor, getDashboardData, requireOwner } from "@/lib/data";
import type { AccessRequestStatus } from "@/lib/types";
import { cn, getBaseUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Edit Asset | Protected Assets",
};

export default async function EditAssetPage({
  params,
  searchParams,
}: {
  params: Promise<{ assetId: string }>;
  searchParams: Promise<{ history_limit?: string; saved?: string }>;
}) {
  const owner = await requireOwner();
  const { assetId } = await params;
  const { history_limit, saved } = await searchParams;

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
  const shareUrl = `${getBaseUrl()}/a/${asset.slug}`;

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-6">
      <SaveSuccessToast open={saved === "1"} />
      <header className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/dashboard"
            className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            <ChevronLeftIcon className="size-4" />
            Back to dashboard
          </Link>

          <div className="grid w-full gap-2 sm:flex sm:w-auto sm:items-center">
            <Link
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "cursor-pointer w-full px-4 text-xs font-bold uppercase tracking-wider text-zinc-600 sm:w-auto",
              )}
            >
              <ExternalLinkIcon className="size-3.5" />
              Open URL
            </Link>

            <form id={deleteFormId} action={deleteAssetAction} className="w-full sm:w-auto">
              <input type="hidden" name="asset_id" value={asset.id} />
              <ConfirmSubmitButton
                formId={deleteFormId}
                triggerLabel="Delete Asset"
                title="Delete this asset?"
                description="This removes the asset and any associated stored files. This action cannot be undone."
                confirmLabel="Delete"
                triggerVariant="outline"
                triggerClassName="h-9 w-full px-4 text-xs font-bold uppercase tracking-wider text-red-600 border-red-100 bg-red-50/50 hover:bg-red-50 hover:text-red-700 transition-colors sm:w-auto"
                icon={<Trash2Icon className="size-3.5 mr-1.5" />}
              />
            </form>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">{asset.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
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
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-500 sm:text-base">
            Update settings, rotate the share slug, or adjust the release policy.
          </p>
        </div>
      </header>

      <div className="pt-8 border-t border-zinc-100">
        <AssetForm action={upsertAssetAction} groups={groups} asset={asset} links={links} files={files} />
      </div>

      {processedRequests.length > 0 && (
        <section className="pt-12 border-t border-zinc-100 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Request History</h2>
              <p className="text-sm text-zinc-500">The most recent approvals and denials for this asset.</p>
            </div>
            <form id={clearHistoryFormId} action={clearRequestHistoryAction} className="w-full sm:w-auto">
              <input type="hidden" name="asset_id" value={asset.id} />
              <input type="hidden" name="redirect_to" value={`/dashboard/assets/${asset.id}`} />
              <ConfirmSubmitButton
                formId={clearHistoryFormId}
                triggerLabel="Clear History"
                title="Clear this asset history?"
                description="This removes all approved, auto-approved, and denied requests for this asset."
                confirmLabel="Clear history"
                triggerVariant="outline"
                triggerClassName="h-9 w-full px-4 text-xs font-bold uppercase tracking-wider text-zinc-500 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 sm:w-auto"
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
