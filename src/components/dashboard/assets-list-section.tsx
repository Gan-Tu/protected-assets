"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { ExternalLinkIcon, SearchIcon } from "lucide-react";

import { CopyLinkButton } from "@/components/app/copy-link-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DashboardAsset } from "@/lib/types";
import { cn, formatHumanDateTime } from "@/lib/utils";

export function AssetsListSection({
  assets,
  baseUrl,
  activeGroupName,
}: {
  assets: DashboardAsset[];
  baseUrl: string;
  activeGroupName?: string | null;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filteredAssets = normalizedQuery
    ? assets.filter((asset) => {
        const searchableText = [
          asset.name,
          asset.description ?? "",
          ...asset.links.map((link) => link.url),
          ...asset.files.map((file) => file.file_name),
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedQuery);
      })
    : assets;

  const emptyMessage = assets.length
    ? "No assets match that search."
    : "No assets created yet.";

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
            {activeGroupName ? `Assets in ${activeGroupName}` : "Recent Assets"}
          </h2>
          <p className="text-sm text-zinc-500">
            Search across asset names, descriptions, links, and files.
          </p>
        </div>
        {activeGroupName ? (
          <Link href="/dashboard" className="cursor-pointer text-sm font-medium text-zinc-600 hover:text-zinc-900">
            View all
          </Link>
        ) : null}
      </div>

      <div className="relative max-w-md">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find assets..."
          className="bg-white pl-9"
        />
      </div>

      <div className="grid gap-4">
        {filteredAssets.length ? (
          filteredAssets.map((asset) => {
            const shareUrl = `${baseUrl}/a/${asset.slug}`;
            return (
              <Card key={asset.id} className="border-zinc-200/60 shadow-sm hover:border-zinc-300 transition-colors">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-zinc-900">{asset.name}</h3>
                        {asset.auto_approve_enabled ? (
                          <Badge className="text-[10px] font-bold uppercase tracking-wider py-0 h-4 rounded-sm border-none bg-amber-100 text-amber-700">
                            Auto
                          </Badge>
                        ) : null}
                        {asset.links.length ? (
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider py-0 h-4 rounded-sm border-zinc-200 text-zinc-500">
                            {asset.links.length} {asset.links.length === 1 ? "link" : "links"}
                          </Badge>
                        ) : null}
                        {asset.files.length ? (
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider py-0 h-4 rounded-sm border-zinc-200 text-zinc-500">
                            {asset.files.length} {asset.files.length === 1 ? "file" : "files"}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm leading-relaxed text-zinc-500">{asset.description || "No description"}</p>
                      <p className="text-xs font-medium text-zinc-400">
                        Last updated {formatHumanDateTime(asset.updated_at)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <CopyLinkButton value={shareUrl} />
                      <Link
                        href={shareUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "cursor-pointer w-full sm:w-auto")}
                      >
                        <ExternalLinkIcon className="size-3.5" />
                        Open URL
                      </Link>
                      <Link
                        href={`/dashboard/assets/${asset.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "cursor-pointer w-full sm:w-auto")}
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-200 p-12 text-center">
            <p className="text-sm text-zinc-500">{emptyMessage}</p>
            {assets.length ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-4 inline-flex cursor-pointer text-sm font-medium text-zinc-900 underline underline-offset-4"
              >
                Clear search
              </button>
            ) : (
              <Link
                href="/dashboard/assets/new"
                className="mt-4 inline-flex cursor-pointer text-sm font-medium text-zinc-900 underline underline-offset-4"
              >
                Create your first asset
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
