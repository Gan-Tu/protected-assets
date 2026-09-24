import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** A text line: the box has the real line height, the bar sits inside it. */
function Line({ className, box = "h-5" }: { className?: string; box?: string }) {
  return (
    <div className={cn("flex items-center", box)}>
      <Skeleton className={cn("h-3.5", className)} />
    </div>
  );
}

/** Copy that wraps to a second line on phones only. */
function WrappingLine({ width, box = "h-5" }: { width: string; box?: string }) {
  return (
    <div>
      <Line box={box} className={width} />
      <Line box={cn(box, "sm:hidden")} className="w-2/5" />
    </div>
  );
}

function FieldSkeleton({
  labelWidth,
  hint,
}: {
  labelWidth: string;
  hint: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 px-5 py-4">
      <Line className={labelWidth} />
      <Skeleton className="h-10 w-full rounded-lg sm:max-w-sm" />
      {hint}
    </div>
  );
}

function SwitchRowSkeleton({ descriptionWidth }: { descriptionWidth: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0 flex-1 space-y-0.5">
        <Line className="w-24" />
        <WrappingLine width={descriptionWidth} />
      </div>
      <Skeleton className="h-[26px] w-[44px] shrink-0 rounded-full" />
    </div>
  );
}

/** Mirrors the settings page box for box, so nothing shifts when it loads. */
export default function SettingsLoading() {
  return (
    <div className="max-w-2xl space-y-8" aria-busy="true">
      <span role="status" className="sr-only">
        Loading settings…
      </span>

      <div className="space-y-1.5">
        <div className="flex h-[35px] items-center sm:h-10">
          <Skeleton className="h-7 w-32 rounded-lg sm:h-8" />
        </div>
        {/* 15px text at leading-relaxed: 24.375px per line. */}
        <WrappingLine box="h-[1.5234375rem]" width="w-full max-w-sm" />
      </div>

      <div className="space-y-2.5">
        <Line className="mx-1 w-16" />
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <FieldSkeleton labelWidth="w-10" hint={<Line className="w-56" />} />
          <FieldSkeleton
            labelWidth="w-28"
            hint={<WrappingLine width="w-full max-w-md" />}
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <Line className="mx-1 w-24" />
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <SwitchRowSkeleton descriptionWidth="w-full max-w-64" />
          <SwitchRowSkeleton descriptionWidth="w-full max-w-md" />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:min-h-[3.75rem] sm:flex-row sm:items-center sm:pl-5">
        <Skeleton className="h-9 w-full rounded-lg sm:ml-auto sm:w-32" />
      </div>
    </div>
  );
}
