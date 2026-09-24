"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FolderIcon, LayersIcon, PlusIcon, XIcon } from "lucide-react";

import {
  createCollectionAction,
  deleteCollectionAction,
} from "@/app/dashboard/actions";
import { ConfirmSubmitButton } from "@/components/app/confirm-submit-button";
import { StatusMessage } from "@/components/app/status-message";
import { SubmitButton } from "@/components/app/submit-button";
import { SectionTitle } from "@/components/dashboard/section-title";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IDLE_STATE } from "@/lib/action-state";
import type { AssetGroup } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LIMITS } from "@/lib/limits";

/** Hover-capable pointers only; touch screens always show the delete button. */
const HOVER_ONLY_HIDDEN =
  "opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/item:opacity-100 focus-visible:opacity-100";

export function CollectionsPanel({
  groups,
  activeGroupId,
  counts,
  totalCount,
  className,
}: {
  groups: AssetGroup[];
  activeGroupId?: string;
  /** Assets per collection id. */
  counts?: Record<string, number>;
  /** All assets, for the "All assets" entry. */
  totalCount?: number;
  className?: string;
}) {
  const [state, formAction] = useActionState(createCollectionAction, IDLE_STATE);
  // An unknown or stale group_id falls back to showing everything.
  const hasActiveGroup = groups.some((group) => group.id === activeGroupId);
  const error = state.status === "error" ? state.message : undefined;

  return (
    <Card className={cn("gap-0 overflow-hidden py-0", className)}>
      <div className="px-4 pt-4 pb-2 sm:px-5">
        <SectionTitle id="collections-title">Collections</SectionTitle>
      </div>

      <nav aria-labelledby="collections-title" className="px-2 pb-3 sm:px-3">
        <ul role="list" className="space-y-0.5">
          <li>
            <CollectionLink
              href="/dashboard"
              active={!hasActiveGroup}
              icon={<LayersIcon />}
              label="All assets"
              count={totalCount}
              // Keeps its count in the same column as the ones beside a delete button.
              reserveDeleteSpace={groups.length > 0}
            />
          </li>

          {groups.map((group) => {
            const formId = `delete-collection-${group.id}`;

            return (
              <li key={group.id} className="group/item relative">
                <CollectionLink
                  href={`/dashboard?group_id=${group.id}`}
                  active={activeGroupId === group.id}
                  icon={<FolderIcon />}
                  label={group.name}
                  count={counts?.[group.id] ?? 0}
                  reserveDeleteSpace
                  deletable
                />
                <form
                  action={deleteCollectionAction}
                  id={formId}
                  className="absolute top-1/2 right-0.5 -translate-y-1/2"
                >
                  <input type="hidden" name="group_id" value={group.id} />
                  <ConfirmSubmitButton
                    formId={formId}
                    triggerLabel=""
                    triggerAriaLabel={`Delete collection ${group.name}`}
                    title={`Delete “${group.name}”?`}
                    description="Assets in this collection are not deleted; they just lose the label."
                    confirmLabel="Delete collection"
                    triggerVariant="ghost"
                    triggerSize="icon-sm"
                    triggerClassName={cn(
                      "text-muted-foreground hover:bg-black/[0.05] hover:text-foreground aria-expanded:bg-black/[0.05]",
                      HOVER_ONLY_HIDDEN,
                    )}
                    icon={<XIcon aria-hidden />}
                  />
                </form>
              </li>
            );
          })}
        </ul>

        {groups.length === 0 ? (
          <p className="px-2.5 pt-2 text-[0.8125rem] leading-5 text-pretty text-muted-foreground">
            No collections yet. Create one to group related assets.
          </p>
        ) : null}
      </nav>

      <div className="border-t border-border px-4 py-4 sm:px-5">
        <form action={formAction} className="flex items-center gap-2">
          <label htmlFor="collection-name" className="sr-only">
            New collection name
          </label>
          <Input
            id="collection-name"
            name="name"
            placeholder="New collection"
            autoComplete="off"
            maxLength={LIMITS.name}
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "collection-name-error" : undefined}
            className="h-9"
          />
          <SubmitButton variant="outline" pendingLabel="Adding…" className="shrink-0">
            <PlusIcon aria-hidden />
            Add
          </SubmitButton>
        </form>

        {error ? (
          <div id="collection-name-error" className="mt-3">
            <StatusMessage status="error">{error}</StatusMessage>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function CollectionLink({
  href,
  active,
  icon,
  label,
  count,
  deletable = false,
  reserveDeleteSpace = false,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  count?: number;
  /** Its row has a delete button that swaps in over the count on hover. */
  deletable?: boolean;
  /** Touch screens always show delete buttons, so leave room for one. */
  reserveDeleteSpace?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm outline-none transition-colors duration-150 ease-out-soft focus-visible:ring-4 focus-visible:ring-primary/25",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        // Room for the always-visible delete button on touch screens; on
        // hover-capable screens it swaps in over the count instead.
        reserveDeleteSpace && "pr-11 [@media(hover:hover)]:pr-2.5",
        active
          ? "bg-primary-subtle font-medium text-primary-subtle-foreground [&_svg]:text-primary"
          : "text-foreground hover:bg-muted/70 [&_svg]:text-subtle-foreground",
      )}
    >
      <span aria-hidden className="contents">
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {typeof count === "number" ? (
        <span
          className={cn(
            "shrink-0 text-xs tabular transition-opacity duration-150 ease-out-soft",
            active ? "text-primary-subtle-foreground" : "text-muted-foreground",
            deletable &&
              "[@media(hover:hover)]:group-hover/item:opacity-0 [@media(hover:hover)]:group-has-[button:focus-visible]/item:opacity-0",
          )}
        >
          <span className="sr-only">(</span>
          {count}
          <span className="sr-only">{count === 1 ? " asset)" : " assets)"}</span>
        </span>
      ) : null}
    </Link>
  );
}
