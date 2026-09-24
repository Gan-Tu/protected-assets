import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requestAccessAction } from "@/app/a/[slug]/actions";
import { RequestAccessForm } from "@/components/forms/request-access-form";
import { SharePage } from "@/components/share/share-page";
import { getPublicAssetView } from "@/lib/services/assets";
import { LIMITS } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Deduped so `generateMetadata` and the page body share a single query. */
const loadAsset = cache(getPublicAssetView);

const REQUEST_LIMITS = {
  name: LIMITS.name,
  email: LIMITS.email,
  reason: LIMITS.reason,
} as const;

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

  return (
    <SharePage
      asset={asset}
      form={
        <RequestAccessForm
          slug={slug}
          action={requestAccessAction}
          limits={REQUEST_LIMITS}
        />
      }
    />
  );
}
