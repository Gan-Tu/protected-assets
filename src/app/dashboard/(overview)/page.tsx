import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon, ChevronDownIcon, HistoryIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { clearRequestHistoryAction } from "@/app/dashboard/actions";
import { ConfirmSubmitButton } from "@/components/app/confirm-submit-button";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { StatusMessage } from "@/components/app/status-message";
import { AssetsListSection } from "@/components/dashboard/assets-list-section";
import { CollectionsPanel } from "@/components/dashboard/collections-panel";
import { RequestDecisionRow } from "@/components/dashboard/request-decision-row";
import { RequestHistoryRow } from "@/components/dashboard/request-history-row";
import { SectionTitle } from "@/components/dashboard/section-title";
import { StatStrip } from "@/components/dashboard/stat-strip";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireOwner } from "@/lib/auth";
import { DEFAULT_HISTORY_LIMIT, MAX_HISTORY_LIMIT } from "@/lib/constants";
import { getDashboardOverview } from "@/lib/services/assets";
import type { AccessRequestStatus } from "@/lib/types";
import { cn, getAutoReleaseTargetIso, getBaseUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Overview | Protected Assets",
  robots: { index: false, follow: false },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    group_id?: string;
    history_limit?: string;
    error?: string;
  }>;
}) {
  const { group_id, history_limit, error } = await searchParams;
  const owner = await requireOwner();

  // History is paginated in SQL rather than fetched whole and sliced.
  const historyLimit =
    history_limit === "all"
      ? MAX_HISTORY_LIMIT
      : Math.min(
          Math.max(Number(history_limit) || DEFAULT_HISTORY_LIMIT, 1),
          MAX_HISTORY_LIMIT,
        );

  const { groups, assets, pendingRequests, history, historyTotal, approvedCount } =
    await getDashboardOverview(owner.id, { historyLimit });

  const activeGroup = group_id
    ? groups.find((group) => group.id === group_id)
    : null;
  const filteredAssets = activeGroup
    ? assets.filter((asset) => asset.group_id === group_id)
    : assets;

  const collectionCounts: Record<string, number> = {};
  for (const asset of assets) {
    if (asset.group_id) {
      collectionCounts[asset.group_id] = (collectionCounts[asset.group_id] ?? 0) + 1;
    }
  }

  const hasMoreHistory = historyTotal > history.length;
  const clearHistoryFormId = "clear-request-history";
  const dashboardRedirect = group_id
    ? `/dashboard?group_id=${group_id}`
    : "/dashboard";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description="Your protected assets and the requests waiting on you."
        actions={
          <Link
            href="/dashboard/assets/new"
            className={cn(buttonVariants(), "h-10 sm:h-9")}
          >
            <PlusIcon aria-hidden />
            New asset
          </Link>
        }
      />

      {error ? <StatusMessage status="error">{error}</StatusMessage> : null}

      <StatStrip
        assetCount={assets.length}
        pendingCount={pendingRequests.length}
        approvedCount={approvedCount}
      />

      {/*
        One grid, so on phones and tablets Collections lands right after the
        assets it filters (before Activity); from lg it becomes a sticky
        sidebar spanning all three rows.
      */}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-[auto_auto_1fr]">
        <section
          id="pending"
          aria-labelledby="pending-title"
          className="min-w-0 scroll-mt-20 space-y-3 lg:col-start-1"
        >
          <div className="flex items-center gap-2">
            <SectionTitle id="pending-title">Pending review</SectionTitle>
            {pendingRequests.length ? (
              <Badge variant="warning">{pendingRequests.length}</Badge>
            ) : null}
          </div>

          {pendingRequests.length ? (
            <ul role="list" className="space-y-3">
              {pendingRequests.map((request) => (
                <li key={request.id}>
                  <RequestDecisionRow
                    requestId={request.id}
                    requesterName={request.requester_name}
                    requesterEmail={request.requester_email}
                    assetName={request.asset?.name ?? "Unknown asset"}
                    reason={request.reason}
                    createdAt={request.created_at}
                    autoReleaseAtIso={getAutoReleaseTargetIso({
                      createdAt: request.created_at,
                      enabled: request.asset?.auto_approve_enabled ?? false,
                      delaySeconds:
                        request.asset?.auto_approve_delay_seconds ?? 0,
                    })}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <Card className="flex-row items-center gap-3.5 px-4 py-4 sm:px-5">
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success-subtle text-success"
              >
                <CheckIcon className="size-[1.125rem]" strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-tight text-foreground">
                  You&rsquo;re all caught up
                </p>
                <p className="text-[0.8125rem] leading-5 text-pretty text-muted-foreground">
                  New access requests will show up here.
                </p>
              </div>
            </Card>
          )}
        </section>

        <AssetsListSection
          className="min-w-0 lg:col-start-1"
          assets={filteredAssets}
          baseUrl={getBaseUrl()}
          activeGroupName={activeGroup?.name ?? null}
        />

        <div className="min-w-0 lg:sticky lg:top-20 lg:col-start-2 lg:row-span-3 lg:row-start-1">
          <CollectionsPanel
            groups={groups}
            activeGroupId={group_id}
            counts={collectionCounts}
            totalCount={assets.length}
          />
        </div>

        <section
          id="activity"
          aria-labelledby="activity-title"
          className="min-w-0 scroll-mt-20 lg:col-start-1"
        >
          <Card className="gap-0 divide-y divide-border overflow-hidden py-0">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3.5 sm:px-5">
              <div className="min-w-0">
                <SectionTitle id="activity-title">Activity</SectionTitle>
                <p className="text-[0.8125rem] leading-5 text-muted-foreground">
                  Approved, auto-released and declined requests.
                </p>
              </div>
              {history.length > 0 ? (
                <form id={clearHistoryFormId} action={clearRequestHistoryAction}>
                  <input
                    type="hidden"
                    name="redirect_to"
                    value={dashboardRedirect}
                  />
                  <ConfirmSubmitButton
                    formId={clearHistoryFormId}
                    triggerLabel="Clear history"
                    title="Clear request history?"
                    description="This removes all approved, auto-approved, and denied requests from your dashboard, and immediately revokes any download links already emailed for them."
                    confirmLabel="Clear history"
                    triggerVariant="outline"
                    triggerSize="sm"
                    icon={<Trash2Icon aria-hidden />}
                  />
                </form>
              ) : null}
            </div>

            {history.length ? (
              history.map((request) => (
                <RequestHistoryRow
                  key={request.id}
                  requesterName={request.requester_name}
                  requesterEmail={request.requester_email}
                  assetName={request.asset?.name}
                  reason={request.reason}
                  decisionNote={request.decision_note}
                  status={request.status as AccessRequestStatus}
                  createdAt={request.created_at}
                  processedAt={request.released_at || request.denied_at}
                />
              ))
            ) : (
              <EmptyState
                size="sm"
                icon={<HistoryIcon />}
                title="No activity yet"
                description="Decisions on access requests will show up here."
              />
            )}

            {hasMoreHistory ? (
              <Link
                href={`/dashboard?history_limit=all${group_id ? `&group_id=${group_id}` : ""}#activity`}
                className="flex h-11 items-center justify-center gap-1.5 text-[0.8125rem] font-medium text-primary outline-none transition-colors duration-150 ease-out-soft hover:bg-muted/50 focus-visible:ring-4 focus-visible:ring-primary/25 focus-visible:ring-inset"
              >
                Show all activity
                <span className="text-muted-foreground tabular">
                  ({historyTotal - history.length} more)
                </span>
                <ChevronDownIcon aria-hidden className="size-3.5" />
              </Link>
            ) : null}
          </Card>
        </section>
      </div>
    </div>
  );
}
