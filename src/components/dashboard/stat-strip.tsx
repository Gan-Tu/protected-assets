import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Three headline numbers in one card, split by hairlines. Stays three columns
 * on phones (like a widget) with shorter copy, instead of stacking tall tiles.
 * When something is waiting, the pending cell becomes a jump link to the queue.
 */
export function StatStrip({
  assetCount,
  pendingCount,
  approvedCount,
  className,
}: {
  assetCount: number;
  pendingCount: number;
  approvedCount: number;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "grid grid-cols-3 gap-0 divide-x divide-border overflow-hidden py-0",
        className,
      )}
    >
      <Stat label="Assets" value={assetCount} />
      <Stat
        label={
          <>
            Pending<span className="max-sm:hidden"> review</span>
          </>
        }
        value={pendingCount}
        href={pendingCount > 0 ? "#pending" : undefined}
        badge={
          pendingCount > 0 ? (
            <Badge variant="warning" dot>
              <span className="sm:hidden">Review</span>
              <span className="max-sm:hidden">Needs review</span>
            </Badge>
          ) : null
        }
      />
      <Stat label="Approved" value={approvedCount} />
    </Card>
  );
}

function Stat({
  label,
  value,
  href,
  badge,
}: {
  label: React.ReactNode;
  value: number;
  href?: string;
  badge?: React.ReactNode;
}) {
  const content = (
    <>
      <span className="truncate text-[0.8125rem] leading-5 font-medium text-muted-foreground">
        {label}
      </span>
      <span className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <span className="text-2xl leading-none font-semibold tracking-tight text-foreground tabular sm:text-[1.75rem]">
          {value}
        </span>
        {badge}
      </span>
    </>
  );

  const cellClassName = "flex min-w-0 flex-col px-4 py-4 sm:px-6 sm:py-5";

  if (href) {
    return (
      <a
        href={href}
        className={cn(
          cellClassName,
          "cursor-pointer outline-none transition-colors duration-150 ease-out-soft hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-4 focus-visible:ring-primary/25 focus-visible:ring-inset",
        )}
      >
        {content}
      </a>
    );
  }

  return <div className={cellClassName}>{content}</div>;
}
