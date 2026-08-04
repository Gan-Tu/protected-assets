"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, ClockIcon, MailIcon, XIcon } from "lucide-react";

import { approveRequestAction, denyRequestAction } from "@/app/dashboard/actions";
import { Countdown } from "@/components/app/countdown";
import { LocalTime } from "@/components/app/local-time";
import { StatusMessage } from "@/components/app/status-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { LIMITS } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

type Decision = "approve" | "deny";

/**
 * Both decisions send an irreversible email, so each one confirms first, shows
 * its own pending label, and reports the outcome inline. Previously these were
 * bare submit buttons that navigated away on success.
 */
export function RequestDecisionRow({
  requestId,
  requesterName,
  requesterEmail,
  assetName,
  reason,
  createdAt,
  autoReleaseAtIso,
}: {
  requestId: string;
  requesterName?: string | null;
  requesterEmail: string;
  assetName: string;
  reason: string;
  createdAt: string;
  autoReleaseAtIso: string | null;
}) {
  const router = useRouter();
  const [decisionNote, setDecisionNote] = useState("");
  const [state, setState] = useState<ActionState>({ status: "idle" });
  const [confirming, setConfirming] = useState<Decision | null>(null);
  const [pendingDecision, setPendingDecision] = useState<Decision | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(decision: Decision) {
    setConfirming(null);
    setPendingDecision(decision);

    startTransition(async () => {
      const action =
        decision === "approve" ? approveRequestAction : denyRequestAction;
      const result = await action({ requestId, decisionNote });

      setState(result);
      setPendingDecision(null);

      if (result.status === "success") {
        // Refresh in place: the owner keeps their scroll position instead of
        // being bounced to the top of the dashboard.
        router.refresh();
      }
    });
  }

  const busy = isPending || pendingDecision !== null;
  const noteId = `decision-note-${requestId}`;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-300">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="h-5 rounded-sm border-zinc-200 py-0 text-[10px] font-bold uppercase tracking-wider text-zinc-500"
            >
              {assetName}
            </Badge>
            {autoReleaseAtIso && (
              <Badge
                variant="secondary"
                className="h-5 rounded-sm border-none bg-orange-50 py-0 text-[10px] font-bold uppercase tracking-wider text-orange-600"
              >
                <ClockIcon className="mr-1 size-3" aria-hidden />
                Releases in{" "}
                <Countdown targetIso={autoReleaseAtIso} className="ml-1" />
              </Badge>
            )}
            <LocalTime
              value={createdAt}
              className="ml-auto text-[10px] font-bold uppercase tracking-wider text-zinc-400 sm:ml-0"
            />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-zinc-900">
              <MailIcon className="size-3.5 text-zinc-400" aria-hidden />
              <span>{requesterName?.trim() || requesterEmail}</span>
              {requesterName?.trim() ? (
                <span className="text-xs font-medium text-zinc-400">
                  {requesterEmail}
                </span>
              ) : null}
            </div>
            <p className="border-l-2 border-zinc-100 pl-4 text-sm italic leading-relaxed text-zinc-600">
              &ldquo;{reason}&rdquo;
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor={noteId}
              className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500"
            >
              Note for requester email
            </label>
            <Textarea
              id={noteId}
              value={decisionNote}
              onChange={(event) => setDecisionNote(event.target.value)}
              maxLength={LIMITS.note}
              disabled={busy}
              placeholder="Optional context to include in the approval or decline email."
              className="min-h-24 resize-y border-zinc-200 bg-zinc-50 text-sm text-zinc-700 placeholder:text-zinc-500 focus-visible:border-zinc-400 focus-visible:ring-zinc-200"
            />
          </div>

          {state.status !== "idle" && state.message ? (
            <StatusMessage
              status={state.status === "error" ? "error" : "success"}
            >
              {state.message}
            </StatusMessage>
          ) : null}
        </div>

        <div className="flex items-center gap-2 sm:self-end">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={busy}
            onClick={() => setConfirming("deny")}
            className="w-full cursor-pointer border-zinc-200 px-4 text-xs font-bold uppercase tracking-wider text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 sm:w-auto"
          >
            <XIcon className="mr-1.5 size-3" aria-hidden />
            {pendingDecision === "deny" ? "Declining..." : "Decline"}
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={busy}
            onClick={() => setConfirming("approve")}
            className="w-full cursor-pointer bg-zinc-900 px-4 text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-zinc-800 sm:w-auto"
          >
            <CheckIcon className="mr-1.5 size-3" aria-hidden />
            {pendingDecision === "approve" ? "Sending..." : "Approve & send"}
          </Button>
        </div>
      </div>

      <Dialog
        open={confirming !== null}
        onOpenChange={(open) => {
          if (!open) setConfirming(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirming === "approve"
                ? `Release ${assetName}?`
                : "Decline this request?"}
            </DialogTitle>
            <DialogDescription>
              {confirming === "approve"
                ? `${requesterEmail} will immediately receive the links and files for this asset. This cannot be undone.`
                : `${requesterEmail} will be emailed that this request was declined.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                />
              }
            >
              Cancel
            </DialogClose>
            <Button
              type="button"
              variant={confirming === "approve" ? "default" : "destructive"}
              className="cursor-pointer"
              onClick={() => confirming && submit(confirming)}
            >
              {confirming === "approve" ? "Approve & send" : "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
