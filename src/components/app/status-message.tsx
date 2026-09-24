import {
  AlertCircleIcon,
  CheckCircle2Icon,
  InfoIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const tones = {
  error: {
    className: "border-[#f6d3cf] bg-danger-subtle text-danger",
    icon: AlertCircleIcon,
  },
  success: {
    className: "border-[#c6e9d3] bg-success-subtle text-success",
    icon: CheckCircle2Icon,
  },
  warning: {
    className: "border-[#f3dfb5] bg-warning-subtle text-warning",
    icon: TriangleAlertIcon,
  },
  info: {
    className: "border-[#cddcf6] bg-info-subtle text-info",
    icon: InfoIcon,
  },
} as const;

/**
 * Announced to screen readers: form failures used to be silent for anyone not
 * looking at the banner. Each tone's text clears 4.8:1 on its tint.
 */
export function StatusMessage({
  status,
  children,
  className,
}: {
  status: keyof typeof tones;
  children: React.ReactNode;
  className?: string;
}) {
  if (!children) return null;

  const tone = tones[status];
  const Icon = tone.icon;
  const isUrgent = status === "error";

  return (
    <div
      role={isUrgent ? "alert" : "status"}
      aria-live={isUrgent ? "assertive" : "polite"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        tone.className,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 leading-relaxed">{children}</div>
    </div>
  );
}
