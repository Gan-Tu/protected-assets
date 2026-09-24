"use client";

import { Fragment, useDeferredValue, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRightIcon,
  FileIcon,
  FilesIcon,
  FolderIcon,
  FolderOpenIcon,
  LayersIcon,
  LinkIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  TimerIcon,
  XIcon,
} from "lucide-react";

import { CopyLinkButton } from "@/components/app/copy-link-button";
import { EmptyState } from "@/components/app/empty-state";
import { LocalTime } from "@/components/app/local-time";
import { SectionTitle } from "@/components/dashboard/section-title";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DashboardAsset } from "@/lib/types";
import { cn, formatRelativeWindow } from "@/lib/utils";

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

/** True when a keystroke belongs to a text field, not to a page shortcut. */
function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function AssetsListSection({
  assets,
  baseUrl,
  activeGroupName,
  className,
}: {
  assets: DashboardAsset[];
  baseUrl: string;
  activeGroupName?: string | null;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" jumps to search from anywhere on the page, like GitHub and Stripe.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.defaultPrevented || event.isComposing) return;
      if (!inputRef.current) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      if (
        event.target instanceof Element &&
        event.target.closest('[role="dialog"], [role="alertdialog"]')
      ) {
        return;
      }

      event.preventDefault();
      inputRef.current.focus();
      inputRef.current.select();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function clearSearch() {
    setQuery("");
    inputRef.current?.focus();
  }

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

  const isSearching = normalizedQuery.length > 0;

  return (
    <section aria-labelledby="assets-title" className={className}>
      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <SectionTitle id="assets-title" className="min-w-0 truncate">
              {activeGroupName ? `Assets in ${activeGroupName}` : "Assets"}
            </SectionTitle>
            <Badge className="shrink-0">
              {isSearching
                ? `${filteredAssets.length} of ${assets.length}`
                : assets.length}
            </Badge>
            {activeGroupName ? (
              <Link
                href="/dashboard"
                className="ml-1 shrink-0 rounded-sm text-[0.8125rem] font-medium whitespace-nowrap text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-primary/25"
              >
                View all
              </Link>
            ) : null}
          </div>

          {assets.length ? (
            <div className="relative w-full sm:w-64 lg:w-72">
              <SearchIcon
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle-foreground"
              />
              <Input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Escape") return;
                  if (query) {
                    event.preventDefault();
                    setQuery("");
                  } else {
                    event.currentTarget.blur();
                  }
                }}
                placeholder="Search assets…"
                aria-label="Search assets"
                aria-keyshortcuts="/"
                enterKeyHint="search"
                autoComplete="off"
                spellCheck={false}
                className="peer pr-10 pl-9 [&::-webkit-search-cancel-button]:appearance-none"
              />
              {query ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <XIcon aria-hidden />
                </Button>
              ) : (
                <kbd
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 right-2.5 hidden h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded-[0.3125rem] border border-border bg-muted px-1 font-mono text-[0.6875rem] leading-none text-muted-foreground transition-opacity duration-150 peer-focus:opacity-0 md:inline-flex"
                >
                  /
                </kbd>
              )}
            </div>
          ) : null}
        </div>

        <p className="sr-only" aria-live="polite" aria-atomic>
          {isSearching
            ? `${plural(filteredAssets.length, "asset", "assets")} found`
            : ""}
        </p>

        {filteredAssets.length ? (
          <ul role="list" className="divide-y divide-border">
            {filteredAssets.map((asset) => (
              <AssetRow
                key={asset.id}
                asset={asset}
                shareUrl={`${baseUrl}/a/${asset.slug}`}
                showCollection={!activeGroupName}
              />
            ))}
          </ul>
        ) : isSearching ? (
          <EmptyState
            size="sm"
            icon={<SearchIcon />}
            title="No matching assets"
            description={
              <>
                Nothing matches &ldquo;{deferredQuery.trim()}&rdquo;. Try a name,
                description, link or file name.
              </>
            }
            action={
              <Button type="button" variant="outline" size="sm" onClick={clearSearch}>
                Clear search
              </Button>
            }
          />
        ) : activeGroupName ? (
          <EmptyState
            size="sm"
            icon={<FolderOpenIcon />}
            title={`Nothing in ${activeGroupName} yet`}
            description="Assign an asset to this collection from its editor."
            action={
              <Link
                href="/dashboard"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                View all assets
              </Link>
            }
          />
        ) : (
          <EmptyState
            icon={<ShieldCheckIcon />}
            title="No assets yet"
            description="Put links and files behind a share page. People ask for access, and you decide who gets it."
            action={
              <Link
                href="/dashboard/assets/new"
                className={cn(buttonVariants(), "h-10 sm:h-9")}
              >
                <PlusIcon aria-hidden />
                Create your first asset
              </Link>
            }
          />
        )}
      </Card>
    </section>
  );
}

function AssetGlyph({ asset }: { asset: DashboardAsset }) {
  const links = asset.links.length;
  const files = asset.files.length;

  const Icon =
    links && files
      ? LayersIcon
      : files > 1
        ? FilesIcon
        : files === 1
          ? FileIcon
          : links
            ? LinkIcon
            : asset.kind === "files"
              ? FileIcon
              : LinkIcon;

  return (
    <span
      aria-hidden
      // Phones give the width to the name and meta; type is in the meta anyway.
      className="hidden size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-xs sm:flex"
    >
      <Icon className="size-[1.125rem]" />
    </span>
  );
}

/**
 * The name is a stretched link (its ::after covers the row), so the whole row
 * opens the editor while the copy/open buttons stay real siblings above it:
 * no interactive element is nested inside another.
 */
function AssetRow({
  asset,
  shareUrl,
  showCollection,
}: {
  asset: DashboardAsset;
  shareUrl: string;
  showCollection: boolean;
}) {
  const meta: React.ReactNode[] = [];

  if (showCollection && asset.group) {
    meta.push(
      <span key="collection">
        <FolderIcon
          aria-hidden
          className="mr-1 inline size-3.5 align-[-3px] text-subtle-foreground"
        />
        <span className="inline-block max-w-[10rem] truncate align-bottom">
          {asset.group.name}
        </span>
      </span>,
    );
  }
  if (asset.links.length) {
    meta.push(
      <span key="links" className="tabular">
        {plural(asset.links.length, "link", "links")}
      </span>,
    );
  }
  if (asset.files.length) {
    meta.push(
      <span key="files" className="tabular">
        {plural(asset.files.length, "file", "files")}
      </span>,
    );
  }
  meta.push(
    <LocalTime key="updated" relative value={asset.updated_at} prefix="Updated " />,
  );

  return (
    <li className="relative flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 ease-out-soft hover:bg-muted/50 has-[a:focus-visible]:bg-muted/50 sm:gap-4 sm:px-5">
      <AssetGlyph asset={asset} />

      <div className="min-w-0 flex-1">
        <Link
          href={`/dashboard/assets/${asset.id}`}
          className="block truncate text-sm leading-5 font-medium text-foreground outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-primary/60 focus-visible:after:ring-inset"
        >
          {asset.name}
        </Link>

        {asset.description ? (
          <p className="mt-0.5 line-clamp-1 text-[0.8125rem] leading-5 break-words text-muted-foreground">
            {asset.description}
          </p>
        ) : null}

        {/*
          Meta is one truncating run of text (so a wrap never strands a "·" at
          a line end); status badges follow and wrap onto their own line.
        */}
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <p className="max-w-full min-w-0 truncate text-xs leading-5 text-muted-foreground">
            {meta.map((node, index) => (
              <Fragment key={index}>
                {index > 0 ? <Dot /> : null}
                {node}
              </Fragment>
            ))}
          </p>
          {asset.pendingCount > 0 ? (
            <Badge variant="warning" dot>
              {asset.pendingCount} pending
            </Badge>
          ) : null}
          {asset.auto_approve_enabled ? (
            <Badge variant="warning">
              <TimerIcon aria-hidden />
              Auto-release
              <span className="font-normal">
                {" "}
                · {formatRelativeWindow(asset.auto_approve_delay_seconds)}
              </span>
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="relative z-10 flex shrink-0 items-center gap-0.5">
        <CopyLinkButton
          value={shareUrl}
          iconOnly
          label="Copy share link"
          copiedLabel="Share link copied"
          variant="ghost"
          size="icon-sm"
        />
        <a
          href={shareUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Open share page"
          title="Open share page"
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        >
          <ArrowUpRightIcon aria-hidden />
        </a>
      </div>
    </li>
  );
}

function Dot() {
  return (
    <span aria-hidden className="mx-1.5 text-subtle-foreground">
      ·
    </span>
  );
}
