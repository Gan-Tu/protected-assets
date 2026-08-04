import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClockIcon, FileKeyIcon, LinkIcon, ShieldCheckIcon } from "lucide-react";

import { requestAccessAction } from "@/app/a/[slug]/actions";
import { LogoMark } from "@/components/app/logo-mark";
import { RequestAccessForm } from "@/components/forms/request-access-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPublicAssetView } from "@/lib/services/assets";
import { formatRelativeWindow } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Deduped so `generateMetadata` and the page body share a single query. */
const loadAsset = cache(getPublicAssetView);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const asset = await loadAsset(slug);

  return {
    title: asset ? `${asset.name} | Protected Assets` : "Protected Assets",
    // Share pages expose asset names and descriptions; keep them out of indexes.
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function ProtectedAssetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const asset = await loadAsset(slug);

  if (!asset) {
    notFound();
  }

  const hasLinks = asset.linkCount > 0;
  const hasFiles = asset.fileCount > 0;

  let deliveryCopy = "Approved access details are sent securely to your inbox.";
  if (hasLinks && hasFiles) {
    deliveryCopy = "Approved requests receive protected assets in email.";
  } else if (hasLinks) {
    deliveryCopy = "Approved links are sent directly to your inbox.";
  } else if (hasFiles) {
    deliveryCopy = "Secure document links are sent to your inbox upon approval.";
  }

  return (
    <main className="relative min-h-screen bg-white text-zinc-950 flex flex-col items-center justify-center p-6 sm:p-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"
      />

      <div className="relative w-full max-w-4xl grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="space-y-8">
          <LogoMark />
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 leading-tight">
              {asset.name}
            </h1>

            <p className="text-base text-zinc-600 leading-relaxed">
              {asset.description ||
                "This asset is protected. Submit your name, email, and reason to request access."}
            </p>

            <ul className="space-y-4 pt-4">
              <li className="flex items-start gap-3">
                <div className="mt-1 size-8 shrink-0 flex items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 text-zinc-400">
                  {hasLinks ? (
                    <LinkIcon className="size-4" aria-hidden />
                  ) : (
                    <FileKeyIcon className="size-4" aria-hidden />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    Secure delivery
                  </p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {deliveryCopy}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-zinc-400">
                    {asset.linkCount} {asset.linkCount === 1 ? "link" : "links"}{" "}
                    and {asset.fileCount}{" "}
                    {asset.fileCount === 1 ? "file" : "files"}
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="mt-1 size-8 shrink-0 flex items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 text-zinc-400">
                  <ShieldCheckIcon className="size-4" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    Manual review
                  </p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    The owner will review your request before granting access.
                  </p>
                </div>
              </li>

              {asset.auto_approve_enabled && (
                <li className="flex items-start gap-3">
                  <div className="mt-1 size-8 shrink-0 flex items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 text-zinc-400">
                    <ClockIcon className="size-4" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      Auto-release
                    </p>
                    <p className="mt-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium leading-relaxed text-amber-950">
                      If the owner does not approve or deny the request, this
                      asset is automatically released to your inbox in{" "}
                      <strong className="font-semibold">
                        {formatRelativeWindow(asset.auto_approve_delay_seconds, {
                          verbose: true,
                        })}
                      </strong>
                      .
                    </p>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>

        <Card className="border-zinc-200 shadow-xl sm:p-4">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold">Request access</CardTitle>
            <CardDescription className="text-sm">
              Provide your name, email, and reason to request this protected
              asset.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RequestAccessForm slug={slug} action={requestAccessAction} />
          </CardContent>
        </Card>
      </div>

      <footer className="mt-20 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          Powered by Protected Assets by Gan
        </p>
      </footer>
    </main>
  );
}
