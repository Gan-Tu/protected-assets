import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Announced to screen readers: form failures used to be silent for anyone not
 * looking at the banner.
 */
export function StatusMessage({
  status,
  children,
  className,
}: {
  status: "error" | "success";
  children: React.ReactNode;
  className?: string;
}) {
  if (!children) return null;

  const isError = status === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={cn(
        "flex items-start gap-2 rounded-md border p-3 text-sm",
        isError
          ? "border-red-100 bg-red-50 text-red-700"
          : "border-emerald-100 bg-emerald-50 text-emerald-700",
        className,
      )}
    >
      {isError ? (
        <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      ) : (
        <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      )}
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}
