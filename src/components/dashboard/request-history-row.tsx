import { CheckCircle2Icon, ClockIcon, MailIcon, XCircleIcon } from "lucide-react";

import { LocalTime } from "@/components/app/local-time";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function RequestHistoryRow({
  requesterName,
  requesterEmail,
  assetName,
  reason,
  decisionNote,
  status,
  createdAt,
  processedAt,
}: {
  requesterName?: string | null;
  requesterEmail: string;
  assetName?: string;
  reason: string;
  decisionNote?: string | null;
  status: "approved" | "denied" | "auto_approved" | "pending";
  createdAt: string;
  processedAt?: string | null;
}) {
  const isApproved = status === "approved" || status === "auto_approved";
  const isDenied = status === "denied";

  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
              <MailIcon className="size-3.5 text-zinc-400" aria-hidden />
              <span>{requesterName?.trim() || requesterEmail}</span>
              {requesterName?.trim() ? (
                <span className="text-xs font-medium text-zinc-500">
                  {requesterEmail}
                </span>
              ) : null}
            </span>
            {assetName && (
              <Badge
                variant="outline"
                className="h-4 border-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-500"
              >
                {assetName}
              </Badge>
            )}
            <Badge
              className={cn(
                "h-4 border-none text-[10px] font-bold uppercase tracking-wider",
                status === "approved" && "bg-emerald-50 text-emerald-700",
                status === "auto_approved" && "bg-blue-50 text-blue-700",
                status === "denied" && "bg-red-50 text-red-700",
                status === "pending" && "bg-zinc-100 text-zinc-600",
              )}
            >
              {status.replace("_", " ")}
            </Badge>
          </div>
          <p className="line-clamp-1 text-xs italic text-zinc-500">
            &ldquo;{reason}&rdquo;
          </p>
          {decisionNote ? (
            <div className="whitespace-pre-line rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs leading-relaxed text-zinc-600">
              <span className="mr-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                Note
              </span>
              {decisionNote}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-4 whitespace-nowrap text-[11px] font-medium text-zinc-500">
          <div className="flex flex-col items-end">
            <span className="flex items-center gap-1">
              <ClockIcon className="size-3" aria-hidden />
              <LocalTime value={createdAt} prefix="Requested " />
            </span>
            {processedAt && (
              <LocalTime
                value={processedAt}
                className="text-zinc-400"
                prefix={`${isApproved ? "Released" : isDenied ? "Denied" : "Processed"} `}
              />
            )}
          </div>
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full",
              isApproved
                ? "bg-emerald-50 text-emerald-600"
                : isDenied
                  ? "bg-red-50 text-red-600"
                  : "bg-zinc-50 text-zinc-400",
            )}
          >
            {isApproved ? (
              <CheckCircle2Icon className="size-4" aria-hidden />
            ) : isDenied ? (
              <XCircleIcon className="size-4" aria-hidden />
            ) : (
              <ClockIcon className="size-4" aria-hidden />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
