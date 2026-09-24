import { MessageSquareTextIcon } from "lucide-react";

import { InitialsAvatar } from "@/components/app/avatar";
import { LocalTime } from "@/components/app/local-time";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type HistoryStatus = "approved" | "denied" | "auto_approved" | "pending";

const statusMeta: Record<
  HistoryStatus,
  {
    label: string;
    variant: React.ComponentProps<typeof Badge>["variant"];
    verb: string;
  }
> = {
  approved: { label: "Approved", variant: "success", verb: "Released" },
  auto_approved: { label: "Auto-released", variant: "accent", verb: "Released" },
  denied: { label: "Declined", variant: "danger", verb: "Declined" },
  pending: { label: "Pending", variant: "neutral", verb: "Requested" },
};

/**
 * One borderless row, meant to sit inside
 * `<Card className="gap-0 divide-y divide-border overflow-hidden py-0">`.
 * Used by the dashboard's Activity list and the asset editor's history.
 *
 * Phones: status + time drop under the text instead of squeezing a column.
 */
export function RequestHistoryRow({
  requesterName,
  requesterEmail,
  assetName,
  reason,
  decisionNote,
  status,
  createdAt,
  processedAt,
  className,
}: {
  requesterName?: string | null;
  requesterEmail: string;
  assetName?: string;
  reason: string;
  decisionNote?: string | null;
  status: HistoryStatus;
  createdAt: string;
  processedAt?: string | null;
  className?: string;
}) {
  const name = requesterName?.trim();
  const meta = statusMeta[status] ?? statusMeta.pending;
  const showProcessed = status !== "pending" && Boolean(processedAt);

  return (
    <div className={cn("flex gap-3 px-4 py-4 sm:gap-3.5 sm:px-5", className)}>
      <InitialsAvatar
        name={name}
        email={requesterEmail}
        size="sm"
        className="-mt-0.5"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:gap-6">
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 flex-wrap items-baseline gap-x-2 leading-6">
            <span className="truncate text-sm font-medium text-foreground">
              {name || requesterEmail}
            </span>
            {name ? (
              <span className="truncate text-[0.8125rem] text-muted-foreground">
                {requesterEmail}
              </span>
            ) : null}
          </p>

          <p className="line-clamp-1 text-[0.8125rem] leading-5 break-words text-muted-foreground">
            {assetName ? (
              <>
                <span className="font-medium text-foreground">{assetName}</span>
                <span aria-hidden> · </span>
              </>
            ) : null}
            <span className="sr-only">Reason: </span>
            &ldquo;{reason}&rdquo;
          </p>

          {decisionNote ? (
            <div className="mt-2.5 flex gap-2 rounded-lg bg-muted px-3 py-2">
              <MessageSquareTextIcon
                aria-hidden
                className="mt-[3px] size-3.5 shrink-0 text-subtle-foreground"
              />
              <p className="min-w-0 text-[0.8125rem] leading-relaxed break-words whitespace-pre-line text-muted-foreground">
                <span className="sr-only">Note: </span>
                {decisionNote}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1 sm:flex-col sm:items-end sm:gap-1.5">
          <Badge variant={meta.variant}>{meta.label}</Badge>
          <LocalTime
            relative
            value={showProcessed ? processedAt : createdAt}
            prefix={showProcessed ? `${meta.verb} ` : "Requested "}
            className="text-xs whitespace-nowrap text-muted-foreground tabular"
          />
        </div>
      </div>
    </div>
  );
}
