import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * A skeleton bar centred in a box as tall as the real text's line, so each
 * placeholder occupies exactly the space its content will.
 */
function Line({ box, bar }: { box: string; bar: string }) {
  return (
    <div className={cn("flex items-center", box)}>
      <Skeleton className={bar} />
    </div>
  );
}

/**
 * Mirrors the overview box for box (header, stat strip, pending, assets,
 * collections, activity) so nothing jumps when the data streams in.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-8" aria-busy="true">
      <p role="status" className="sr-only">
        Loading overview…
      </p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <Line box="h-[35px] sm:h-10" bar="h-7 w-40 sm:h-8" />
          <div>
            <Line box="h-6" bar="h-3.5 w-80 max-w-full" />
            <Line box="h-6 sm:hidden" bar="h-3.5 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-lg sm:h-9 sm:w-[7.25rem]" />
      </div>

      <Card className="grid grid-cols-3 gap-0 divide-x divide-border overflow-hidden py-0">
        {["w-12", "w-14 sm:w-24", "w-16"].map((width, index) => (
          <div key={index} className="flex flex-col px-4 py-4 sm:px-6 sm:py-5">
            <Line box="h-5" bar={cn("h-3.5", width)} />
            <Skeleton className="mt-2 h-6 w-9 sm:h-7" />
          </div>
        ))}
      </Card>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-[auto_auto_1fr]">
        <div className="space-y-3 lg:col-start-1">
          <Line box="h-6" bar="h-4 w-28" />
          <Card className="flex-row items-center gap-3.5 px-4 py-4 sm:px-5">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Line box="h-5" bar="h-3.5 w-36" />
              <Line box="h-5" bar="h-3 w-56 max-w-full" />
            </div>
          </Card>
        </div>

        <Card className="gap-0 overflow-hidden py-0 lg:col-start-1">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
            <div className="flex h-6 items-center gap-2">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-[22px] w-7 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg sm:w-64 lg:w-72" />
          </div>
          <div className="divide-y divide-border">
            {["w-32", "w-44", "w-28"].map((width, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5"
              >
                <Skeleton className="hidden size-10 shrink-0 rounded-xl sm:block" />
                <div className="min-w-0 flex-1">
                  <Line box="h-5" bar={cn("h-3.5 max-w-full", width)} />
                  <Line box="mt-0.5 h-5" bar="h-3 w-full max-w-72" />
                  <Line box="mt-1 h-5" bar="h-3 w-40 max-w-full" />
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <Skeleton className="size-8 rounded-md" />
                  <Skeleton className="size-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="gap-0 overflow-hidden py-0 lg:col-start-2 lg:row-span-3 lg:row-start-1">
          <div className="px-4 pt-4 pb-2 sm:px-5">
            <Line box="h-6" bar="h-4 w-24" />
          </div>
          <div className="space-y-0.5 px-2 pb-3 sm:px-3">
            {["w-20", "w-14", "w-16", "w-12"].map((width, index) => (
              <div key={index} className="flex h-9 items-center gap-2.5 px-2.5">
                <Skeleton className="size-4 rounded" />
                <Skeleton className={cn("h-3.5", width)} />
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-border px-4 py-4 sm:px-5">
            <Skeleton className="h-9 flex-1 rounded-lg" />
            <Skeleton className="h-9 w-[4.5rem] rounded-lg" />
          </div>
        </Card>

        <Card className="gap-0 divide-y divide-border overflow-hidden py-0 lg:col-start-1">
          {/* Same width as the real copy, so "Clear history" wraps where it does. */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3.5 sm:px-5">
            <div className="w-[18rem] max-w-full min-w-0">
              <Line box="h-6" bar="h-4 w-20" />
              <Line box="h-5" bar="h-3 w-60 max-w-full" />
            </div>
            <Skeleton className="h-8 w-28 shrink-0 rounded-md" />
          </div>
          {["w-40", "w-52"].map((width, index) => (
            <div key={index} className="flex gap-3 px-4 py-4 sm:gap-3.5 sm:px-5">
              <Skeleton className="-mt-0.5 size-7 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:gap-6">
                <div className="min-w-0 flex-1">
                  <Line box="h-6" bar={cn("h-3.5 max-w-full", width)} />
                  <Line box="h-5" bar="h-3 w-72 max-w-full" />
                </div>
                <div className="flex items-center gap-2.5 sm:flex-col sm:items-end sm:gap-1.5">
                  <Skeleton className="h-[22px] w-20 rounded-full" />
                  <Line box="h-4" bar="h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
