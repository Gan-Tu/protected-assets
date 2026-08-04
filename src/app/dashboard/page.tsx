import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock4Icon,
  FileLock2Icon,
  MailPlusIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { clearRequestHistoryAction } from "@/app/dashboard/actions";
import { ConfirmSubmitButton } from "@/components/app/confirm-submit-button";
import { StatusMessage } from "@/components/app/status-message";
import { AssetsListSection } from "@/components/dashboard/assets-list-section";
import { CollectionsPanel } from "@/components/dashboard/collections-panel";
import { RequestDecisionRow } from "@/components/dashboard/request-decision-row";
import { RequestHistoryRow } from "@/components/dashboard/request-history-row";
import { Card, CardContent } from "@/components/ui/card";
import { requireOwner } from "@/lib/auth";
import { DEFAULT_HISTORY_LIMIT, MAX_HISTORY_LIMIT } from "@/lib/constants";
import { getDashboardOverview } from "@/lib/services/assets";
import type { AccessRequestStatus } from "@/lib/types";
import { getAutoReleaseTargetIso, getBaseUrl } from "@/lib/utils";

const primaryLinkClass =
  "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 sm:w-auto sm:whitespace-nowrap";

export const metadata: Metadata = {
  title: "Dashboard | Protected Assets",
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

  const stats = [
    { label: "Assets", value: assets.length, icon: FileLock2Icon },
    { label: "Pending", value: pendingRequests.length, icon: MailPlusIcon },
    { label: "Approved", value: approvedCount, icon: Clock4Icon },
  ];

  const hasMoreHistory = historyTotal > history.length;
  const clearHistoryFormId = "clear-request-history";
  const dashboardRedirect = group_id
    ? `/dashboard?group_id=${group_id}`
    : "/dashboard";

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 pb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your protected assets and access requests.
          </p>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <Link href="/dashboard/assets/new" className={primaryLinkClass}>
            <PlusIcon className="size-4" aria-hidden />
            New asset
          </Link>
        </div>
      </header>

      {error ? <StatusMessage status="error">{error}</StatusMessage> : null}

      <section className="grid gap-6 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-zinc-200/60 py-0 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                <stat.icon className="size-4 text-zinc-400" aria-hidden />
              </div>
              <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
        <div className="space-y-12">
          <AssetsListSection
            assets={filteredAssets}
            baseUrl={getBaseUrl()}
            activeGroupName={activeGroup?.name ?? null}
          />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
              Pending approvals
            </h2>
            <div className="space-y-3">
              {pendingRequests.length ? (
                pendingRequests.map((request) => (
                  <RequestDecisionRow
                    key={request.id}
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
                ))
              ) : (
                <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-6 text-center">
                  <p className="text-sm text-zinc-500">
                    All caught up. No pending requests.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
                History
              </h2>
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
                    triggerClassName="h-9 px-4 text-xs font-bold uppercase tracking-wider text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
                    icon={<Trash2Icon className="mr-1.5 size-3.5" aria-hidden />}
                  />
                </form>
              ) : null}
            </div>
            <div className="space-y-3">
              {history.length ? (
                <>
                  {history.map((request) => (
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
                  ))}
                  {hasMoreHistory && (
                    <div className="pt-2 text-center">
                      <Link
                        href={`/dashboard?history_limit=all${group_id ? `&group_id=${group_id}` : ""}`}
                        className="text-xs font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-900"
                      >
                        Show more history ({historyTotal - history.length} more)
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-lg border border-zinc-100 p-6 text-center">
                  <p className="text-sm italic text-zinc-500">
                    No request history yet.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-12">
          <CollectionsPanel groups={groups} activeGroupId={group_id} />
        </aside>
      </div>
    </div>
  );
}
