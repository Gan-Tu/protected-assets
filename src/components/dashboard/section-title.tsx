import { cn } from "@/lib/utils";

/**
 * One title style for every overview section (inside or outside a card), so
 * Pending review, Assets, Activity and Collections read as one system.
 */
export function SectionTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "text-[0.9375rem] leading-6 font-semibold tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  );
}
