import type { Metadata } from "next";
import Link from "next/link";
import { Clock4Icon, FileLock2Icon, MailPlusIcon, Trash2Icon, XIcon, PlusIcon } from "lucide-react";

import {
  clearRequestHistoryAction,
  createCollectionAction,
  deleteCollectionAction,
} from "@/app/dashboard/actions";
import { ConfirmSubmitButton } from "@/components/app/confirm-submit-button";
import { AssetsListSection } from "@/components/dashboard/assets-list-section";
import { RequestDecisionRow } from "@/components/dashboard/request-decision-row";
import { RequestHistoryRow } from "@/components/dashboard/request-history-row";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardData, requireOwner } from "@/lib/data";
import type { AccessRequestStatus } from "@/lib/types";
import { formatRelativeWindow, getBaseUrl, cn } from "@/lib/utils";

const primaryLinkClass =
  "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 sm:w-auto sm:whitespace-nowrap";

export const metadata: Metadata = {
  title: "Dashboard | Protected Assets",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ group_id?: string; history_limit?: string }>;
}) {
  const { group_id, history_limit } = await searchParams;
  const owner = await requireOwner();
  const { groups, assets, pendingRequests, requests } = await getDashboardData(owner.id);

  const activeGroup = group_id ? groups.find((g) => g.id === group_id) : null;
  const filteredAssets = activeGroup 
    ? assets.filter((a) => a.group_id === group_id) 
    : assets;

  const stats = [
    { label: "Assets", value: assets.length, icon: FileLock2Icon },
    { label: "Pending", value: pendingRequests.length, icon: MailPlusIcon },
    {
      label: "Approved",
      value: requests.filter((request) => request.status !== "pending" && request.status !== "denied").length,
      icon: Clock4Icon,
    },
  ];

  const limit = history_limit === "all" ? requests.length : 5;
  const allProcessed = requests.filter((request) => request.status !== "pending");
  const processedRequests = allProcessed
    .slice(0, limit)
    .map((request) => ({
      ...request,
      asset: assets.find((asset) => asset.id === request.asset_id) ?? null,
    }));

  const hasMoreHistory = allProcessed.length > limit;
  const clearHistoryFormId = "clear-request-history";
  const dashboardRedirect = group_id ? `/dashboard?group_id=${group_id}` : "/dashboard";

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your protected assets and access requests.</p>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <Link href="/dashboard/assets/new" className={primaryLinkClass}>
            <PlusIcon className="size-4" />
            New Asset
          </Link>
        </div>
      </header>

      <section className="grid gap-6 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-zinc-200/60 py-0 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                <stat.icon className="size-4 text-zinc-400" />
              </div>
              <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">{stat.value}</p>
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
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Pending Approvals</h2>
            <div className="space-y-3">
              {pendingRequests.length ? (
                pendingRequests.map((request) => (
                  <RequestDecisionRow
                    key={request.id}
                    requestId={request.id}
                    requesterEmail={request.requester_email}
                    assetName={request.asset.name}
                    reason={request.reason}
                    createdAt={request.created_at}
                    autoApproveLabel={
                      request.asset.auto_approve_enabled
                        ? formatRelativeWindow(request.asset.auto_approve_delay_seconds)
                        : null
                    }
                  />
                ))
              ) : (
                <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-6 text-center">
                  <p className="text-sm text-zinc-500">All caught up! No pending requests.</p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900">History</h2>
              {processedRequests.length > 0 ? (
                <form id={clearHistoryFormId} action={clearRequestHistoryAction}>
                  <input type="hidden" name="redirect_to" value={dashboardRedirect} />
                  <ConfirmSubmitButton
                    formId={clearHistoryFormId}
                    triggerLabel="Clear History"
                    title="Clear request history?"
                    description="This removes all approved, auto-approved, and denied requests from your dashboard history."
                    confirmLabel="Clear history"
                    triggerVariant="outline"
                    triggerClassName="h-9 px-4 text-xs font-bold uppercase tracking-wider text-zinc-500 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
                    icon={<Trash2Icon className="size-3.5 mr-1.5" />}
                  />
                </form>
              ) : null}
            </div>
            <div className="space-y-3">
              {processedRequests.length ? (
                <>
                  {processedRequests.map((request) => (
                    <RequestHistoryRow
                      key={request.id}
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
                        className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                      >
                        Show more history
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-lg border border-zinc-50 p-6 text-center">
                  <p className="text-sm text-zinc-400 italic">No request history yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-12">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Collections</h2>
            <form action={createCollectionAction} className="flex flex-col gap-2">
              <input
                name="name"
                placeholder="New collection..."
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-1 focus:ring-zinc-400"
                required
              />
              <button type="submit" className={primaryLinkClass}>
                Create
              </button>
            </form>
            <div className="flex flex-col gap-1">
              {groups.length ? (
                groups.map((group) => (
                  <div key={group.id} className={cn(
                    "group flex items-center justify-between rounded-md px-2 py-1.5 transition-colors",
                    group_id === group.id ? "bg-zinc-100" : "hover:bg-zinc-50"
                  )}>
                    <Link 
                      href={`/dashboard?group_id=${group.id}`}
                      className={cn(
                        "text-sm font-medium transition-colors",
                        group_id === group.id ? "text-zinc-900" : "text-zinc-600 hover:text-zinc-900"
                      )}
                    >
                      {group.name}
                    </Link>
                    <form action={deleteCollectionAction} id={`delete-collection-${group.id}`}>
                      <input type="hidden" name="group_id" value={group.id} />
                      <ConfirmSubmitButton
                        formId={`delete-collection-${group.id}`}
                        triggerLabel=""
                        title="Delete collection?"
                        description="Assets will remain intact."
                        confirmLabel="Delete"
                        triggerVariant="ghost"
                        triggerClassName="opacity-0 group-hover:opacity-100 size-6 p-0 text-zinc-400 hover:text-zinc-900 transition-opacity"
                        icon={<XIcon className="size-3.5" />}
                      />
                    </form>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-400 italic px-2">No collections yet.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
