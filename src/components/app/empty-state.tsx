import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = "default",
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  size?: "default" | "sm";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "default" ? "gap-3 px-6 py-12" : "gap-2 px-4 py-8",
        className,
      )}
    >
      {icon ? (
        <div className="mb-1 flex size-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-xs [&_svg]:size-5">
          {icon}
        </div>
      ) : null}
      <p className="text-[0.9375rem] font-semibold tracking-tight text-foreground">
        {title}
      </p>
      {description ? (
        <p className="max-w-sm text-sm leading-relaxed text-pretty text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
