import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClockIcon, FileKeyIcon, LinkIcon, ShieldCheckIcon } from "lucide-react";

import { requestAccessAction } from "@/app/a/[slug]/actions";
import { LogoMark } from "@/components/app/logo-mark";
import { RequestAccessForm } from "@/components/forms/request-access-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicAssetBySlug } from "@/lib/data";
import { formatRelativeWindow } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const asset = await getPublicAssetBySlug(slug);

  return {
    title: asset ? `${asset.name} | Protected Assets` : "Protected Assets",
  };
}

export default async function ProtectedAssetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const asset = await getPublicAssetBySlug(slug);

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
    deliveryCopy = "Signed document links are sent to your inbox upon approval.";
  }

  return (
    <main className="min-h-screen bg-white text-zinc-950 flex flex-col items-center justify-center p-6 sm:p-12">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="relative w-full max-w-4xl grid gap-12 lg:grid-cols-2 items-center">
        <div className="space-y-8">
          <LogoMark />
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 leading-tight">
                {asset.name}
              </h1>
            </div>
            
            <p className="text-base text-zinc-600 leading-relaxed">
              {asset.description ||
                "This asset is protected. Submit your email and reason to request access."}
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 size-8 shrink-0 flex items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 text-zinc-400">
                  {hasLinks ? (
                    <LinkIcon className="size-4" />
                  ) : (
                    <FileKeyIcon className="size-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Secure Delivery</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {deliveryCopy}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-zinc-400">
                    {asset.linkCount} {asset.linkCount === 1 ? "link" : "links"} and {asset.fileCount} {asset.fileCount === 1 ? "file" : "files"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 size-8 shrink-0 flex items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 text-zinc-400">
                  <ShieldCheckIcon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Manual Review</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    The owner will review your request before granting access.
                  </p>
                </div>
              </div>

              {asset.auto_approve_enabled && (
                <div className="flex items-start gap-3">
                  <div className="mt-1 size-8 shrink-0 flex items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 text-zinc-400">
                    <ClockIcon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Auto-Release</p>
                    <p className="mt-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium leading-relaxed text-amber-950">
                      If owner doesn&apos;t approve or deny the request, the files will be automatically released to your inbox in{" "}
                      <strong className="font-semibold">
                        {formatRelativeWindow(asset.auto_approve_delay_seconds, { verbose: true })}
                      </strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Card className="border-zinc-200 shadow-xl sm:p-4">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold">Request Access</CardTitle>
            <CardDescription className="text-sm">
              Provide your details to request this protected asset.
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
