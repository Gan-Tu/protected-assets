"use client";

import { useActionState } from "react";
import Link from "next/link";
import { XIcon } from "lucide-react";

import {
  createCollectionAction,
  deleteCollectionAction,
} from "@/app/dashboard/actions";
import { ConfirmSubmitButton } from "@/components/app/confirm-submit-button";
import { StatusMessage } from "@/components/app/status-message";
import { SubmitButton } from "@/components/app/submit-button";
import { Input } from "@/components/ui/input";
import { IDLE_STATE } from "@/lib/action-state";
import type { AssetGroup } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LIMITS } from "@/lib/validation";

export function CollectionsPanel({
  groups,
  activeGroupId,
}: {
  groups: AssetGroup[];
  activeGroupId?: string;
}) {
  const [state, formAction] = useActionState(createCollectionAction, IDLE_STATE);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
        Collections
      </h2>

      <form action={formAction} className="flex flex-col gap-2">
        <label htmlFor="collection-name" className="sr-only">
          New collection name
        </label>
        <Input
          id="collection-name"
          name="name"
          placeholder="New collection..."
          className="bg-white"
          maxLength={LIMITS.name}
          required
        />
        <SubmitButton className="w-full" pendingLabel="Creating...">
          Create
        </SubmitButton>
      </form>

      {state.status === "error" && state.message ? (
        <StatusMessage status="error">{state.message}</StatusMessage>
      ) : null}

      <div className="flex flex-col gap-1">
        {groups.length ? (
          groups.map((group) => (
            <div
              key={group.id}
              className={cn(
                "group flex items-center justify-between rounded-md px-2 py-1.5 transition-colors",
                activeGroupId === group.id ? "bg-zinc-100" : "hover:bg-zinc-50",
              )}
            >
              <Link
                href={`/dashboard?group_id=${group.id}`}
                className={cn(
                  "text-sm font-medium transition-colors",
                  activeGroupId === group.id
                    ? "text-zinc-900"
                    : "text-zinc-600 hover:text-zinc-900",
                )}
              >
                {group.name}
              </Link>
              <form
                action={deleteCollectionAction}
                id={`delete-collection-${group.id}`}
              >
                <input type="hidden" name="group_id" value={group.id} />
                <ConfirmSubmitButton
                  formId={`delete-collection-${group.id}`}
                  triggerLabel=""
                  triggerAriaLabel={`Delete collection ${group.name}`}
                  title={`Delete "${group.name}"?`}
                  description="Assets in this collection are not deleted; they just lose the label."
                  confirmLabel="Delete"
                  triggerVariant="ghost"
                  // Visible on hover, but always reachable by keyboard.
                  triggerClassName="size-6 p-0 text-zinc-500 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                  icon={<XIcon className="size-3.5" aria-hidden />}
                />
              </form>
            </div>
          ))
        ) : (
          <p className="px-2 text-xs italic text-zinc-500">
            No collections yet.
          </p>
        )}
      </div>
    </section>
  );
}
