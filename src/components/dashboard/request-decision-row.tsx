import { Clock4Icon, MailIcon } from "lucide-react";

import { approveRequestAction, denyRequestAction } from "@/app/dashboard/actions";
import { SubmitButton } from "@/components/app/submit-button";
import { Badge } from "@/components/ui/badge";

export function RequestDecisionRow({
  requestId,
  requesterEmail,
  assetName,
  reason,
  createdAt,
  autoApproveLabel,
}: {
  requestId: string;
  requesterEmail: string;
  assetName: string;
  reason: string;
  createdAt: string;
  autoApproveLabel: string | null;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-full border-slate-200 text-slate-600">
              {assetName}
            </Badge>
            {autoApproveLabel ? (
              <Badge variant="secondary" className="rounded-full">
                Auto release in {autoApproveLabel}
              </Badge>
            ) : null}
          </div>
          <p className="flex items-center gap-2 text-sm font-medium text-slate-950">
            <MailIcon className="size-4 text-slate-500" />
            {requesterEmail}
          </p>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">{reason}</p>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
            <Clock4Icon className="size-3.5" />
            {new Date(createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <form action={denyRequestAction}>
            <input type="hidden" name="request_id" value={requestId} />
            <SubmitButton variant="outline" pendingLabel="Declining...">
              Decline
            </SubmitButton>
          </form>
          <form action={approveRequestAction}>
            <input type="hidden" name="request_id" value={requestId} />
            <SubmitButton pendingLabel="Approving...">Approve</SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
