import { MailIcon, CheckIcon, XIcon } from "lucide-react";

import { approveRequestAction, denyRequestAction } from "@/app/dashboard/actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function RequestDecisionRow({
  requestId,
  requesterName,
  requesterEmail,
  assetName,
  reason,
  createdAt,
  autoApproveLabel,
}: {
  requestId: string;
  requesterName?: string | null;
  requesterEmail: string;
  assetName: string;
  reason: string;
  createdAt: string;
  autoApproveLabel: string | null;
}) {
  return (
    <div className="group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-300">
      <form className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <input type="hidden" name="request_id" value={requestId} />
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
             <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider py-0 h-5 rounded-sm border-zinc-200 text-zinc-500">
              {assetName}
            </Badge>
            {autoApproveLabel && (
              <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider py-0 h-5 rounded-sm bg-orange-50 text-orange-600 border-none">
                Auto-release: {autoApproveLabel}
              </Badge>
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 ml-auto sm:ml-0">
              {new Date(createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <MailIcon className="size-3.5 text-zinc-400" />
              <span>{requesterName?.trim() || requesterEmail}</span>
              {requesterName?.trim() ? (
                <span className="text-xs font-medium text-zinc-400">{requesterEmail}</span>
              ) : null}
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed italic border-l-2 border-zinc-100 pl-4">
              &ldquo;{reason}&rdquo;
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor={`decision-note-${requestId}`}
              className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400"
            >
              Note for requester email
            </label>
            <Textarea
              id={`decision-note-${requestId}`}
              name="decision_note"
              placeholder="Optional context to include in the approval or decline email."
              className="min-h-24 resize-y border-zinc-200 bg-zinc-50 text-sm text-zinc-700 placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-zinc-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:self-end">
          <button
            type="submit"
            formAction={denyRequestAction}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full px-4 text-xs font-bold uppercase tracking-wider text-zinc-500 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 sm:w-auto",
            )}
          >
              <XIcon className="size-3 mr-1.5" />
              Decline
          </button>
          <button
            type="submit"
            formAction={approveRequestAction}
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full px-4 text-xs font-bold uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 shadow-sm sm:w-auto",
            )}
          >
              <CheckIcon className="size-3 mr-1.5" />
              Approve & Send
          </button>
        </div>
      </form>
    </div>
  );
}
