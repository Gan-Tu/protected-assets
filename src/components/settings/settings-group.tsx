import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * Apple Settings-style group: a quiet sentence-case label above one card whose
 * rows are split by hairlines.
 */
export function SettingsGroup({
  id,
  title,
  className,
  children,
}: {
  id: string;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  const headingId = `${id}-heading`;

  return (
    <section aria-labelledby={headingId} className={cn("space-y-2.5", className)}>
      <h2
        id={headingId}
        className="px-1 text-sm leading-5 font-medium text-muted-foreground"
      >
        {title}
      </h2>
      <Card className="gap-0 divide-y divide-border overflow-hidden py-0">
        {children}
      </Card>
    </section>
  );
}

export function SettingsRow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

/**
 * The whole row is the label, so the title and description toggle the switch
 * too. The switch is named by the title alone and described by the sentence
 * below it, rather than reading both as one long name.
 */
export function SwitchRow({
  id,
  name,
  title,
  description,
  defaultChecked,
}: {
  id: string;
  name: string;
  title: string;
  description: string;
  defaultChecked?: boolean;
}) {
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 transition-colors duration-150 ease-out-soft hover:bg-muted/50"
    >
      <span className="min-w-0">
        <span
          id={labelId}
          className="block text-sm leading-5 font-medium text-foreground"
        >
          {title}
        </span>
        <span
          id={descriptionId}
          className="mt-0.5 block text-[0.8125rem] leading-5 text-pretty text-muted-foreground"
        >
          {description}
        </span>
      </span>
      <Switch
        id={id}
        name={name}
        defaultChecked={defaultChecked}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
      />
    </label>
  );
}

/**
 * Save bar for a settings form. Sticky, so on a short phone screen the button
 * stays reachable; it rests in place when everything fits. (A scroll-state
 * container query could deepen the shadow only while stuck, but Lightning CSS,
 * which the production build uses, can't parse it yet.)
 */
export function SettingsSaveBar({
  status,
  children,
}: {
  status?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-10">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-lg sm:min-h-[3.75rem] sm:flex-row sm:items-center sm:pl-5">
        {status ? <div className="min-w-0 sm:flex-1">{status}</div> : null}
        <div className="sm:ml-auto">{children}</div>
      </div>
    </div>
  );
}
