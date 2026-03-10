import { notFound } from "next/navigation";

import { Clock4Icon, FileKey2Icon, Link2Icon, ShieldCheckIcon } from "lucide-react";

import { requestAccessAction } from "@/app/a/[slug]/actions";
import { AmbientOrbits } from "@/components/app/ambient-orbits";
import { LogoMark } from "@/components/app/logo-mark";
import { RequestAccessForm } from "@/components/forms/request-access-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicAssetBySlug } from "@/lib/data";
import { formatRelativeWindow } from "@/lib/utils";

export const dynamic = "force-dynamic";

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

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#dff4ff,transparent_30%),linear-gradient(180deg,#f7fbff_0%,#eef2f8_45%,#f7f8fb_100%)] px-6 py-8 sm:px-8">
      <AmbientOrbits />
      <div className="relative mx-auto max-w-5xl">
        <LogoMark />
        <div className="grid min-h-[calc(100vh-6rem)] items-center gap-8 lg:grid-cols-[1fr_0.92fr]">
          <div className="max-w-xl">
            <Badge className="rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-slate-600">
              protected access
            </Badge>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-slate-950">
              {asset.name}
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              {asset.description ||
                "This asset is protected. Submit your email and context to request access."}
            </p>
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-white/70 px-4 py-4 text-sm text-slate-700">
                {asset.kind === "link" ? (
                  <Link2Icon className="size-4 text-slate-500" />
                ) : (
                  <FileKey2Icon className="size-4 text-slate-500" />
                )}
                {asset.kind === "link"
                  ? "When approved, the protected link is sent to your inbox."
                  : "When approved, signed document download links are sent to your inbox."}
              </div>
              <div className="flex items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-white/70 px-4 py-4 text-sm text-slate-700">
                <ShieldCheckIcon className="size-4 text-slate-500" />
                Requests are reviewed by the owner before release.
              </div>
              {asset.auto_approve_enabled ? (
                <div className="flex items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-white/70 px-4 py-4 text-sm text-slate-700">
                  <Clock4Icon className="size-4 text-slate-500" />
                  If the owner doesn&apos;t respond, access auto-releases in{" "}
                  <strong>{formatRelativeWindow(asset.auto_approve_delay_seconds)}</strong>.
                </div>
              ) : null}
            </div>
          </div>
          <Card className="border-white/60 bg-white/88 py-6 shadow-[0_40px_90px_rgba(15,23,42,0.1)] backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-2xl tracking-tight text-slate-950">
                Request access
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-slate-600">
                Your request goes directly to the asset owner, along with your reason for access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RequestAccessForm slug={slug} action={requestAccessAction} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
