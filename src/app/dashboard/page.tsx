import Link from "next/link";

import { Clock4Icon, FileLock2Icon, FolderPlusIcon, Link2Icon, MailPlusIcon, XIcon } from "lucide-react";

import { createCollectionAction, deleteCollectionAction } from "@/app/dashboard/actions";
import { ConfirmSubmitButton } from "@/components/app/confirm-submit-button";
import { CopyLinkButton } from "@/components/app/copy-link-button";
import { RequestDecisionRow } from "@/components/dashboard/request-decision-row";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData, requireOwner } from "@/lib/data";
import { formatRelativeWindow, getBaseUrl } from "@/lib/utils";

const primaryLinkClass =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800";
const secondaryLinkClass =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-50";
const ghostLinkClass =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white";

export default async function DashboardPage() {
  const owner = await requireOwner();
  const { groups, assets, pendingRequests, requests } = await getDashboardData(owner.id);

  const stats = [
    { label: "Protected assets", value: assets.length, icon: FileLock2Icon },
    { label: "Pending requests", value: pendingRequests.length, icon: MailPlusIcon },
    {
      label: "Approved requests",
      value: requests.filter((request) => request.status !== "pending" && request.status !== "denied").length,
      icon: Clock4Icon,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-white/60 bg-white/92 py-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          <CardHeader>
            <Badge className="w-fit rounded-full border border-sky-200 bg-sky-50 text-slate-700">
              Release control center
            </Badge>
            <CardTitle className="text-3xl tracking-tight text-slate-950">
              Protected assets, one clean queue.
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-7 text-slate-600">
              Create locked share links, capture requester context, then approve instantly or let auto-release policies take over.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
                <stat.icon className="size-4 text-slate-500" />
                <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-slate-600">{stat.label}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/60 bg-white/92 py-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          <CardHeader>
            <CardTitle className="text-xl tracking-tight text-slate-950">Collections</CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Organize assets into simple folders for faster triage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={createCollectionAction} className="flex gap-3">
              <input
                name="name"
                placeholder="Investor materials"
                className="h-10 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm outline-none"
                required
              />
              <button
                type="submit"
                className={primaryLinkClass}
              >
                <FolderPlusIcon className="size-4" />
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              {groups.length ? (
                groups.map((group) => (
                  <form key={group.id} id={`delete-collection-${group.id}`} action={deleteCollectionAction}>
                    <input type="hidden" name="group_id" value={group.id} />
                    <Badge
                      variant="outline"
                      className="flex items-center gap-2 rounded-full border-slate-200 px-3 py-1"
                    >
                      <span>{group.name}</span>
                      <ConfirmSubmitButton
                        formId={`delete-collection-${group.id}`}
                        triggerLabel=""
                        title={`Delete "${group.name}"?`}
                        description="Assets in this collection will stay intact and simply become unassigned."
                        confirmLabel="Delete collection"
                        triggerVariant="ghost"
                        triggerClassName="size-5 rounded-full p-0 text-slate-400 hover:bg-transparent hover:text-slate-900"
                        icon={<XIcon className="size-3.5" />}
                      />
                    </Badge>
                  </form>
                ))
              ) : (
                <p className="text-sm text-slate-500">No collections yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Your assets</h2>
            <p className="text-sm text-slate-600">Edit settings, inspect request activity, and copy protected links.</p>
          </div>
          <Link
            href="/dashboard/assets/new"
            className={primaryLinkClass}
          >
            New asset
          </Link>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          {assets.length ? (
            assets.map((asset) => {
              const shareUrl = `${getBaseUrl()}/a/${asset.slug}`;
              return (
                <Card
                  key={asset.id}
                  className="border-white/60 bg-white/92 py-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="rounded-full border-slate-200">
                            {asset.kind === "link" ? "Link" : "Files"}
                          </Badge>
                          {asset.group ? (
                            <Badge variant="secondary" className="rounded-full">
                              {asset.group.name}
                            </Badge>
                          ) : null}
                          {asset.auto_approve_enabled ? (
                            <Badge className="rounded-full border border-sky-200 bg-sky-50 text-slate-700">
                              Auto release {formatRelativeWindow(asset.auto_approve_delay_seconds)}
                            </Badge>
                          ) : null}
                        </div>
                        <CardTitle className="mt-3 text-xl tracking-tight text-slate-950">
                          {asset.name}
                        </CardTitle>
                        <CardDescription className="mt-2 text-sm leading-6 text-slate-600">
                          {asset.description || "No description added yet."}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Requests</p>
                        <p className="mt-3 text-2xl font-semibold text-slate-950">{asset.requestCount}</p>
                      </div>
                      <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Pending</p>
                        <p className="mt-3 text-2xl font-semibold text-slate-950">{asset.pendingCount}</p>
                      </div>
                      <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Bundle</p>
                        <p className="mt-3 text-sm font-medium text-slate-950">
                          {asset.kind === "link" ? "Direct URL" : `${asset.files.length} files`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <CopyLinkButton value={shareUrl} />
                      <Link
                        href={`/dashboard/assets/${asset.id}`}
                        className={secondaryLinkClass}
                      >
                        Edit asset
                      </Link>
                      <Link
                        href={shareUrl}
                        className={ghostLinkClass}
                      >
                        <Link2Icon className="size-4" />
                        Open public page
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border-white/60 bg-white/92 py-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
              <CardHeader>
                <CardTitle className="text-xl tracking-tight text-slate-950">No assets yet</CardTitle>
                <CardDescription className="text-sm text-slate-600">
                  Create your first protected link or document bundle to start collecting requests.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/dashboard/assets/new"
                  className={primaryLinkClass}
                >
                  Create your first asset
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Pending approvals</h2>
          <p className="text-sm text-slate-600">
            Review requests in one pass. Auto-release windows are shown inline.
          </p>
        </div>
        <div className="space-y-4">
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
            <Card className="border-white/60 bg-white/92 py-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
              <CardContent className="text-sm text-slate-600">
                No pending requests. New inbound requests will appear here.
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
