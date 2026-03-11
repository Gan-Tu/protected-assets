import { CheckCircle2Icon, XCircleIcon, ClockIcon, MailIcon } from "lucide-react";
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
            <span className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
              <MailIcon className="size-3.5 text-zinc-400" />
              <span>{requesterName?.trim() || requesterEmail}</span>
              {requesterName?.trim() ? (
                <span className="text-xs font-medium text-zinc-400">{requesterEmail}</span>
              ) : null}
            </span>
            {assetName && (
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider h-4 border-zinc-100 text-zinc-400">
                {assetName}
              </Badge>
            )}
            <Badge
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider h-4 border-none",
                status === "approved" && "bg-emerald-50 text-emerald-600",
                status === "auto_approved" && "bg-blue-50 text-blue-600",
                status === "denied" && "bg-red-50 text-red-600",
                status === "pending" && "bg-zinc-100 text-zinc-600"
              )}
            >
              {status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 line-clamp-1 italic">
            &ldquo;{reason}&rdquo;
          </p>
          {decisionNote ? (
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs leading-relaxed text-zinc-600 whitespace-pre-line">
              <span className="mr-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                Note
              </span>
              {decisionNote}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-medium whitespace-nowrap">
          <div className="flex flex-col items-end">
            <span className="flex items-center gap-1">
              <ClockIcon className="size-3" />
              Requested {new Date(createdAt).toLocaleDateString()}
            </span>
            {processedAt && (
              <span className="flex items-center gap-1 text-zinc-300">
                {isApproved ? "Released" : isDenied ? "Denied" : "Processed"} {new Date(processedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className={cn(
            "size-8 rounded-full flex items-center justify-center shrink-0",
            isApproved ? "bg-emerald-50 text-emerald-600" : isDenied ? "bg-red-50 text-red-600" : "bg-zinc-50 text-zinc-400"
          )}>
            {isApproved ? <CheckCircle2Icon className="size-4" /> : isDenied ? <XCircleIcon className="size-4" /> : <ClockIcon className="size-4" />}
          </div>
        </div>
      </div>
    </div>
  );
}
