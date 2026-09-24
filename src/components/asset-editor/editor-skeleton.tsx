import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Same rhythm as `Field`: 20px label row, 8px gap, control, then a hint line. */
function FieldSkeleton({
  label,
  control = "h-10",
  hint,
  action,
}: {
  label: string;
  control?: string;
  hint?: string;
  action?: string;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex min-h-5 items-center justify-between gap-3">
        <Skeleton className={cn("h-3.5", label)} />
        {action ? <Skeleton className={cn("h-[34px] rounded-[0.625rem]", action)} /> : null}
      </div>
      <Skeleton className={cn("w-full rounded-lg", control)} />
      {hint ? (
        <div className="flex h-5 items-center">
          <Skeleton className={cn("h-3", hint)} />
        </div>
      ) : null}
    </div>
  );
}

/** Stacked 20px text lines (label + hint rows), like the real sub-headings. */
function LinesSkeleton({ widths, className }: { widths: string[]; className?: string }) {
  return (
    <div className={cn("grid gap-0.5", className)}>
      {widths.map((width, index) => (
        <div key={index} className="flex h-5 items-center">
          <Skeleton className={cn(index === 0 ? "h-3.5" : "h-3", "max-w-full", width)} />
        </div>
      ))}
    </div>
  );
}

/** Mirrors `EditorCard`: title + one-line description, 24px to the content. */
function CardSkeleton({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-6">
      <div className="grid gap-1 px-5">
        <div className="flex h-[1.3rem] items-center">
          <Skeleton className={cn("h-4", title)} />
        </div>
        <div className="flex h-[1.4rem] items-center">
          <Skeleton className={cn("h-3.5 max-w-full", description)} />
        </div>
      </div>
      <div className="grid gap-6 px-5">{children}</div>
    </Card>
  );
}

/**
 * Loading state for both editor routes. Box for box with the real page
 * (header, share link, two-column grid, save bar) so nothing jumps when the
 * data arrives.
 */
export function AssetEditorSkeleton({ mode }: { mode: "new" | "edit" }) {
  const isEdit = mode === "edit";

  return (
    <div className="space-y-8" aria-busy="true">
      <p role="status" className="sr-only">
        {isEdit ? "Loading asset…" : "Loading editor…"}
      </p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="mb-3 flex h-8 items-center">
            <Skeleton className="h-3.5 w-20" />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex h-[35px] items-center sm:h-10">
              {/* Narrow on phones in edit mode so the badges share the row, as they do for typical names. */}
              <Skeleton className={cn("h-7 sm:h-8 sm:w-60", isEdit ? "w-28" : "w-44")} />
            </div>
            {isEdit ? (
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-[22px] w-12 rounded-full" />
                <Skeleton className="h-[22px] w-12 rounded-full" />
                <Skeleton className="h-[22px] w-[4.5rem] rounded-full" />
              </div>
            ) : null}
          </div>
          {isEdit ? null : (
            <div>
              <div className="flex h-6 items-center">
                <Skeleton className="h-4 w-80 max-w-full" />
              </div>
              {/* The description wraps to a second line on phones. */}
              <div className="flex h-6 items-center sm:hidden">
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          )}
        </div>
        {isEdit ? (
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-lg sm:h-9 sm:w-40 sm:flex-none" />
            <Skeleton className="h-10 flex-1 rounded-lg sm:h-9 sm:w-24 sm:flex-none" />
          </div>
        ) : null}
      </div>

      {isEdit ? (
        <Card
          size="sm"
          className="gap-3 px-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5"
        >
          <div className="flex items-center gap-3 sm:w-64 sm:shrink-0">
            <Skeleton className="size-9 shrink-0 rounded-xl" />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3 w-44 max-w-full" />
            </div>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Skeleton className="h-10 min-w-0 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-[6.5rem] shrink-0 rounded-lg" />
          </div>
        </Card>
      ) : null}

      <div>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid min-w-0 gap-6">
            <CardSkeleton title="w-16" description="w-72">
              <FieldSkeleton label="w-12" />
              <FieldSkeleton label="w-20" hint="w-64" />
              <FieldSkeleton label="w-20" action="w-[7.5rem]" hint="w-56" />
              <FieldSkeleton label="w-24" control="h-20" hint="w-40" />
            </CardSkeleton>

            <CardSkeleton title="w-16" description="w-72">
              <div className="grid gap-3">
                <LinesSkeleton widths={["w-12", "w-64"]} />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
              <div className="grid gap-3 border-t border-border pt-6">
                <div className="grid gap-0.5">
                  <div className="flex h-5 items-center">
                    <Skeleton className="h-3.5 w-10" />
                  </div>
                  <div>
                    <div className="flex h-5 items-center">
                      <Skeleton className="h-3 w-72 max-w-full" />
                    </div>
                    {/* Wraps to a second line on phones. */}
                    <div className="flex h-5 items-center sm:hidden">
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-[158px] w-full rounded-xl" />
              </div>
            </CardSkeleton>
          </div>

          <div className="grid min-w-0 gap-6">
            <CardSkeleton title="w-28" description="w-56">
              <div className="flex items-start justify-between gap-4">
                {/* Label, then a two-line hint (one paragraph, so no gap between its lines). */}
                <div className="grid flex-1 gap-0.5">
                  <div className="flex h-5 items-center">
                    <Skeleton className="h-3.5 w-24" />
                  </div>
                  <div>
                    <div className="flex h-5 items-center">
                      <Skeleton className="h-3 w-full max-w-52" />
                    </div>
                    <div className="flex h-5 items-center">
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
                <Skeleton className="mt-0.5 h-[26px] w-[44px] rounded-full" />
              </div>
              <FieldSkeleton label="w-24" control="h-20" hint="w-48" />
            </CardSkeleton>

            {/* Same line count as the real note at this width: 2 + 3 lines. */}
            <div className="rounded-2xl border border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-7 rounded-lg" />
                <Skeleton className="h-3.5 w-32" />
              </div>
              <div className="mt-3 grid gap-2.5 pl-6">
                <div>
                  {["w-full", "w-2/5"].map((width, index) => (
                    <div key={index} className="flex h-5 items-center">
                      <Skeleton className={cn("h-3", width)} />
                    </div>
                  ))}
                </div>
                <div>
                  {["w-full", "w-full", "w-1/4"].map((width, index) => (
                    <div key={index} className="flex h-5 items-center">
                      <Skeleton className={cn("h-3", width)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-border bg-card/80 p-2.5 shadow-lg sm:pl-4">
          <Skeleton className="hidden h-3.5 w-56 sm:block" />
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Skeleton className="h-10 rounded-lg sm:h-9 sm:w-[4.75rem]" />
            <Skeleton className="h-10 rounded-lg sm:h-9 sm:w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}
