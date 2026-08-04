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
import { AssetForm } from "@/components/forms/asset-form";
import { RequestHistoryRow } from "@/components/dashboard/request-history-row";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireOwner } from "@/lib/auth";
import { ASSET_HISTORY_LIMIT, MAX_HISTORY_LIMIT } from "@/lib/constants";
import { isAppError } from "@/lib/errors";
import { getAssetEditorData } from "@/lib/services/assets";
import type { AccessRequestStatus } from "@/lib/types";
import { cn, getBaseUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Edit asset | Protected Assets",
  robots: { index: false, follow: false },
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

  const historyLimit =
    history_limit === "all" ? MAX_HISTORY_LIMIT : ASSET_HISTORY_LIMIT;

  // Only "not yours / not found" becomes a 404; real failures still surface.
  const data = await getAssetEditorData(owner.id, assetId, {
    historyLimit,
  }).catch((error) => {
    if (isAppError(error) && error.status === 404) return null;
    throw error;
  });

  if (!data) {
    notFound();
  }

  const { asset, groups, links, files, history, historyTotal, requestCount } =
    data;
  const deleteFormId = `delete-asset-${asset.id}`;
  const clearHistoryFormId = `clear-request-history-${asset.id}`;
  const hasMoreHistory = historyTotal > history.length;
  const shareUrl = `${getBaseUrl()}/a/${asset.slug}`;

  return (
    <div className="mx-auto max-w-5xl space-y-12 py-6">
      <SaveSuccessToast open={saved === "1"} />
      <header className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/dashboard"
            className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
          >
            <ChevronLeftIcon className="size-4" aria-hidden />
            Back to dashboard
          </Link>

          <div className="grid w-full gap-2 sm:flex sm:w-auto sm:items-center">
            <Link
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full cursor-pointer px-4 text-xs font-bold uppercase tracking-wider text-zinc-600 sm:w-auto",
              )}
            >
              <ExternalLinkIcon className="size-3.5" aria-hidden />
              Open share page
            </Link>

            <form
              id={deleteFormId}
              action={deleteAssetAction}
              className="w-full sm:w-auto"
            >
              <input type="hidden" name="asset_id" value={asset.id} />
              <ConfirmSubmitButton
                formId={deleteFormId}
                triggerLabel="Delete asset"
                title="Delete this asset?"
                description="This removes the asset, its stored files, and any pending auto-release timers. This action cannot be undone."
                confirmLabel="Delete"
                triggerVariant="outline"
                triggerClassName="h-9 w-full px-4 text-xs font-bold uppercase tracking-wider text-red-600 border-red-100 bg-red-50/50 hover:bg-red-50 hover:text-red-700 transition-colors sm:w-auto"
                icon={<Trash2Icon className="mr-1.5 size-3.5" aria-hidden />}
              />
            </form>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
              {asset.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {links.length ? (
                <Badge
                  variant="outline"
                  className="h-5 border-zinc-200 text-[10px] font-bold uppercase tracking-wider text-zinc-600"
                >
                  {links.length} {links.length === 1 ? "link" : "links"}
                </Badge>
              ) : null}
              {files.length ? (
                <Badge
                  variant="outline"
                  className="h-5 border-zinc-200 text-[10px] font-bold uppercase tracking-wider text-zinc-600"
                >
                  {files.length} {files.length === 1 ? "file" : "files"}
                </Badge>
              ) : null}
              <Badge className="h-5 border-none bg-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                {requestCount} requests
              </Badge>
            </div>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-500 sm:text-base">
            Update settings, rotate the share slug, or adjust the release policy.
          </p>
        </div>
      </header>

      <div className="border-t border-zinc-100 pt-8">
        <AssetForm
          action={upsertAssetAction}
          groups={groups}
          asset={asset}
          links={links}
          files={files}
        />
      </div>

      {history.length > 0 && (
        <section className="space-y-6 border-t border-zinc-100 pt-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
                Request history
              </h2>
              <p className="text-sm text-zinc-500">
                The most recent approvals and denials for this asset.
              </p>
            </div>
            <form
              id={clearHistoryFormId}
              action={clearRequestHistoryAction}
              className="w-full sm:w-auto"
            >
              <input type="hidden" name="asset_id" value={asset.id} />
              <input
                type="hidden"
                name="redirect_to"
                value={`/dashboard/assets/${asset.id}`}
              />
              <ConfirmSubmitButton
                formId={clearHistoryFormId}
                triggerLabel="Clear history"
                title="Clear this asset's history?"
                description="This removes all approved, auto-approved, and denied requests for this asset, and revokes any download links already emailed for them."
                confirmLabel="Clear history"
                triggerVariant="outline"
                triggerClassName="h-9 w-full px-4 text-xs font-bold uppercase tracking-wider text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 sm:w-auto"
                icon={<Trash2Icon className="mr-1.5 size-3.5" aria-hidden />}
              />
            </form>
          </div>
          <div className="space-y-3">
            {history.map((request) => (
              <RequestHistoryRow
                key={request.id}
                requesterName={request.requester_name}
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
                  className="text-xs font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-900"
                >
                  Show more history ({historyTotal - history.length} more)
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
