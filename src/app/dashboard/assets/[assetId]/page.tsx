import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRightIcon, ChevronDownIcon, Trash2Icon } from "lucide-react";

import {
  clearRequestHistoryAction,
  deleteAssetAction,
  upsertAssetAction,
} from "@/app/dashboard/actions";
import { ConfirmSubmitButton } from "@/components/app/confirm-submit-button";
import { PageHeader } from "@/components/app/page-header";
import { SaveSuccessToast } from "@/components/app/save-success-toast";
import { BackLink } from "@/components/asset-editor/back-link";
import { ShareLinkCard } from "@/components/asset-editor/share-link-card";
import { RequestHistoryRow } from "@/components/dashboard/request-history-row";
import { AssetForm } from "@/components/forms/asset-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

function countLabel(count: number, noun: string) {
  return `${count} ${count === 1 ? noun : `${noun}s`}`;
}

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
  const baseUrl = getBaseUrl();
  const shareUrl = `${baseUrl}/a/${asset.slug}`;
  /**
   * Search params don't remount the page, so a save (which redirects here with
   * `?saved=1`) would otherwise keep the form's pre-save state: finished
   * uploads would stay queued for a second submit, and the toast (which reads
   * `open` once, on mount) would never show. `updated_at` changes on every
   * save, so keying on it gives both a fresh mount exactly then.
   */
  const revision = asset.updated_at;

  return (
    <div className="space-y-8">
      <SaveSuccessToast
        key={`toast-${revision}`}
        open={saved === "1"}
        placement="above-bar"
      />

      <PageHeader
        eyebrow={<BackLink />}
        title={asset.name}
        meta={
          <>
            {links.length ? (
              <Badge>{countLabel(links.length, "link")}</Badge>
            ) : null}
            {files.length ? (
              <Badge>{countLabel(files.length, "file")}</Badge>
            ) : null}
            <Badge>{countLabel(requestCount, "request")}</Badge>
          </>
        }
        actions={
          <>
            <Link
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline" }), "h-10 sm:h-9")}
            >
              View share page
              <ArrowUpRightIcon className="text-subtle-foreground" aria-hidden />
              <span className="sr-only"> (opens in a new tab)</span>
            </Link>

            <form id={deleteFormId} action={deleteAssetAction}>
              <input type="hidden" name="asset_id" value={asset.id} />
              <ConfirmSubmitButton
                formId={deleteFormId}
                triggerLabel="Delete"
                title="Delete this asset?"
                description="This removes the asset, its stored files, and any pending auto-release timers. This action cannot be undone."
                confirmLabel="Delete asset"
                triggerVariant="destructive-subtle"
                triggerClassName="h-10 w-full sm:h-9 sm:w-auto"
                icon={<Trash2Icon aria-hidden />}
              />
            </form>
          </>
        }
      />

      <ShareLinkCard url={shareUrl} />

      <AssetForm
        key={`form-${revision}`}
        action={upsertAssetAction}
        groups={groups}
        asset={asset}
        links={links}
        files={files}
        shareBaseUrl={baseUrl}
        cancelHref="/dashboard"
      />

      {history.length > 0 ? (
        <section aria-labelledby="activity-heading" className="space-y-4 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h2
                id="activity-heading"
                className="text-[0.9375rem] leading-6 font-semibold tracking-tight text-foreground"
              >
                Activity
              </h2>
              <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
                Approvals, declines and auto-releases for this asset.
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
                title="Clear this asset’s history?"
                description="This removes all approved, auto-approved, and denied requests for this asset, and revokes any download links already emailed for them."
                confirmLabel="Clear history"
                triggerVariant="outline"
                triggerSize="sm"
                triggerClassName="h-10 w-full sm:h-8 sm:w-auto"
                icon={<Trash2Icon aria-hidden />}
              />
            </form>
          </div>

          <Card className="gap-0 divide-y divide-border overflow-hidden py-0">
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
            {hasMoreHistory ? (
              <Link
                href={`/dashboard/assets/${asset.id}?history_limit=all`}
                scroll={false}
                className="flex h-11 items-center justify-center gap-1.5 text-sm font-medium text-primary outline-none transition-colors duration-150 ease-out-soft hover:bg-surface-subtle focus-visible:bg-primary-subtle"
              >
                Show all activity ({historyTotal - history.length} more)
                <ChevronDownIcon className="size-4" aria-hidden />
              </Link>
            ) : null}
          </Card>
        </section>
      ) : null}
    </div>
  );
}
