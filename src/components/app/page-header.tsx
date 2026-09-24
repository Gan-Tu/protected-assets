import { cn } from "@/lib/utils";

/**
 * Title block shared by every owner page: optional eyebrow/back link, title,
 * supporting copy, and right-aligned actions that wrap below on phones.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  meta,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  /** Inline badges next to the title. */
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1.5">
        {eyebrow ? <div className="mb-3">{eyebrow}</div> : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="min-w-0 text-[1.75rem] leading-tight font-semibold tracking-[-0.03em] break-words text-foreground sm:text-[2rem]">
            {title}
          </h1>
          {meta ? <div className="flex flex-wrap items-center gap-1.5">{meta}</div> : null}
        </div>
        {description ? (
          <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
