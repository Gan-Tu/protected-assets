import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Sentence-case pills. Every tone pairs a tinted background with a foreground
 * that clears 4.8:1 on it, so status text is legible at 12px.
 */
const badgeVariantStyles = cva(
  "group/badge inline-flex h-[22px] w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 text-xs leading-none font-medium whitespace-nowrap tabular [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        neutral: "bg-[#efeff2] text-[#48484d]",
        accent: "bg-primary-subtle text-primary-subtle-foreground",
        success: "bg-success-subtle text-success",
        warning: "bg-warning-subtle text-warning",
        danger: "bg-danger-subtle text-danger",
        info: "bg-info-subtle text-info",
        outline: "border-border bg-card text-muted-foreground",
        solid: "bg-foreground text-background",
      },
      dot: {
        true: "before:size-1.5 before:shrink-0 before:rounded-full before:bg-current before:content-['']",
        false: "",
      },
    },
    defaultVariants: {
      variant: "neutral",
      dot: false,
    },
  }
)

/** Merged like buttonVariants, so tone overrides beat base classes anywhere. */
function badgeVariants({
  variant,
  dot,
  className,
}: VariantProps<typeof badgeVariantStyles> & { className?: string } = {}) {
  return cn(badgeVariantStyles({ variant, dot }), className)
}

function Badge({
  className,
  variant = "neutral",
  dot = false,
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariantStyles>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: badgeVariants({
          variant,
          dot,
          className: typeof className === "string" ? className : undefined,
        }),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
