import * as React from "react"
import { AlertCircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/**
 * The id a control should put in `aria-describedby`. Mirrors what `Field`
 * renders: the error replaces the hint while present.
 */
export function describedBy(
  id: string,
  { hint, error }: { hint?: React.ReactNode; error?: React.ReactNode }
) {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}

/**
 * Label above, control, then either the error (announced, with an icon so it
 * is not signalled by color alone) or the hint. Pair with `describedBy()`:
 *
 *   <Field id="email" label="Email" error={errors.email}>
 *     <Input id="email" aria-invalid={!!errors.email}
 *       aria-describedby={describedBy("email", { error: errors.email })} />
 *   </Field>
 */
function Field({
  id,
  label,
  hint,
  error,
  optional,
  action,
  className,
  children,
}: {
  id: string
  label: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  optional?: boolean
  /** Right-aligned element on the label row, e.g. a "Create new" toggle. */
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div data-slot="field" className={cn("grid gap-2", className)}>
      <div className="flex min-h-5 items-center justify-between gap-3">
        <Label htmlFor={id}>
          {label}
          {optional ? (
            <span className="font-normal text-muted-foreground">Optional</span>
          ) : null}
        </Label>
        {action}
      </div>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          className="flex items-start gap-1.5 text-[0.8125rem] leading-5 text-danger"
        >
          <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${id}-hint`}
          className="text-[0.8125rem] leading-5 text-muted-foreground"
        >
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export { Field }
