function Shimmer({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-zinc-100 ${className}`} />;
}

/** Skeleton for the dashboard's multi-query render. */
export default function DashboardLoading() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Loading dashboard">
      <div className="flex flex-col gap-4 pb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Shimmer className="h-8 w-48" />
          <Shimmer className="h-4 w-72" />
        </div>
        <Shimmer className="h-9 w-32" />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Shimmer key={index} className="h-24 w-full" />
        ))}
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Shimmer className="h-6 w-40" />
          <Shimmer className="h-10 w-full max-w-md" />
          {[0, 1, 2].map((index) => (
            <Shimmer key={index} className="h-28 w-full" />
          ))}
        </div>
        <div className="space-y-4">
          <Shimmer className="h-6 w-32" />
          <Shimmer className="h-9 w-full" />
          <Shimmer className="h-9 w-full" />
        </div>
      </div>
    </div>
  );
}
