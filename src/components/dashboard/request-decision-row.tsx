"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, ClockIcon, MessageSquarePlusIcon, XIcon } from "lucide-react";

import { approveRequestAction, denyRequestAction } from "@/app/dashboard/actions";
import { InitialsAvatar } from "@/components/app/avatar";
import { Countdown } from "@/components/app/countdown";
import { LocalTime } from "@/components/app/local-time";
import { StatusMessage } from "@/components/app/status-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, describedBy } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { LIMITS } from "@/lib/limits";
import type { ActionState } from "@/lib/action-state";

type Decision = "approve" | "deny";

const NOTE_HINT = "Included in the approval or decline email.";

/**
 * Both decisions send an irreversible email, so each one confirms first, shows
 * its own pending label, and reports the outcome inline. The optional note
 * stays folded away until asked for, which keeps a long queue scannable.
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
  const [noteOpen, setNoteOpen] = useState(false);
  const [state, setState] = useState<ActionState>({ status: "idle" });
  const [confirming, setConfirming] = useState<Decision | null>(null);
  // Outlives `confirming` so the dialog copy doesn't flip mid exit-animation.
  const [dialogDecision, setDialogDecision] = useState<Decision>("approve");
  const [pendingDecision, setPendingDecision] = useState<Decision | null>(null);
  const [isPending, startTransition] = useTransition();

  // Set when "Remove" unmounts the note, so focus lands back on "Add a note".
  const refocusAddNote = useRef(false);

  function askToConfirm(decision: Decision) {
    setDialogDecision(decision);
    setConfirming(decision);
  }

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
  // Once decided, the row is on its way out of the queue; don't invite a
  // second click while the refresh lands.
  const decided = state.status === "success";
  const noteId = `decision-note-${requestId}`;
  const showNote = noteOpen || decisionNote.length > 0;
  const name = requesterName?.trim();
  const hasNote = decisionNote.trim().length > 0;

  return (
    <Card className="gap-0 px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-start gap-3">
        <InitialsAvatar name={name} email={requesterEmail} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[0.9375rem] leading-6 font-semibold tracking-tight text-foreground">
                {name || requesterEmail}
              </p>
              {name ? (
                <p className="truncate text-[0.8125rem] leading-5 text-muted-foreground">
                  {requesterEmail}
                </p>
              ) : null}
            </div>
            <LocalTime
              relative
              value={createdAt}
              className="shrink-0 pt-0.5 text-[0.8125rem] leading-5 whitespace-nowrap text-muted-foreground tabular"
            />
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Badge className="max-w-full">
              <span className="sr-only">Asset: </span>
              <span className="truncate">{assetName}</span>
            </Badge>
            {autoReleaseAtIso ? (
              <Badge variant="warning" className="max-w-full">
                <ClockIcon aria-hidden />
                <span className="truncate">
                  Auto-releases in{" "}
                  <Countdown targetIso={autoReleaseAtIso} className="tabular" />
                </span>
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4 sm:pl-12">
        <blockquote className="rounded-xl bg-muted px-4 py-3 text-sm leading-relaxed break-words whitespace-pre-line text-foreground">
          <span className="sr-only">Reason: </span>
          {reason}
        </blockquote>

        {showNote ? (
          <Field
            id={noteId}
            label="Note to requester"
            hint={NOTE_HINT}
            optional
            action={
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={busy || decided}
                onClick={() => {
                  refocusAddNote.current = true;
                  setDecisionNote("");
                  setNoteOpen(false);
                }}
                className="-mr-2 text-muted-foreground hover:text-foreground"
              >
                Remove
              </Button>
            }
          >
            <Textarea
              id={noteId}
              value={decisionNote}
              onChange={(event) => setDecisionNote(event.target.value)}
              maxLength={LIMITS.note}
              disabled={busy || decided}
              rows={3}
              // Only mounts in response to "Add a note", so focus follows the click.
              autoFocus={noteOpen && decisionNote.length === 0}
              placeholder="Add context for the requester…"
              aria-describedby={describedBy(noteId, { hint: NOTE_HINT })}
              className="min-h-24 resize-y"
            />
          </Field>
        ) : null}

        {state.status !== "idle" && state.message ? (
          <StatusMessage status={state.status === "error" ? "error" : "success"}>
            {state.message}
          </StatusMessage>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {showNote ? (
            <span aria-hidden className="hidden sm:block" />
          ) : (
            <Button
              ref={(node: HTMLButtonElement | null) => {
                if (node && refocusAddNote.current) {
                  refocusAddNote.current = false;
                  node.focus();
                }
              }}
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy || decided}
              onClick={() => setNoteOpen(true)}
              className="-ml-2.5 self-start text-muted-foreground hover:text-foreground sm:self-auto"
            >
              <MessageSquarePlusIcon aria-hidden />
              Add a note
            </Button>
          )}

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Button
              type="button"
              variant="outline"
              disabled={busy || decided}
              aria-busy={pendingDecision === "deny" || undefined}
              onClick={() => askToConfirm("deny")}
              className="h-10 sm:h-9"
            >
              {pendingDecision === "deny" ? (
                <>
                  <Spinner />
                  Declining…
                </>
              ) : (
                <>
                  <XIcon aria-hidden />
                  Decline
                </>
              )}
            </Button>
            <Button
              type="button"
              disabled={busy || decided}
              aria-busy={pendingDecision === "approve" || undefined}
              onClick={() => askToConfirm("approve")}
              className="h-10 sm:h-9"
            >
              {pendingDecision === "approve" ? (
                <>
                  <Spinner />
                  Sending…
                </>
              ) : (
                <>
                  <CheckIcon aria-hidden />
                  Approve &amp; send
                </>
              )}
            </Button>
          </div>
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
            <DialogTitle className="break-words">
              {dialogDecision === "approve"
                ? `Release \u201c${assetName}\u201d?`
                : "Decline this request?"}
            </DialogTitle>
            <DialogDescription className="break-words">
              {dialogDecision === "approve"
                ? `${requesterEmail} will immediately receive the links and files for this asset. This can\u2019t be undone.`
                : `${requesterEmail} will be emailed that this request was declined.`}
              {hasNote ? " Your note will be included." : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="button"
              variant={dialogDecision === "approve" ? "default" : "destructive"}
              onClick={() => confirming && submit(confirming)}
            >
              {dialogDecision === "approve" ? "Approve & send" : "Decline request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
