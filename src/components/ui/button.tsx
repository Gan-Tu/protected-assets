import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Transitions are listed explicitly (never `all`) so hover/press never animate
 * layout, and `active:scale` gives immediate tactile feedback before any
 * network round-trip completes.
 */
const buttonVariantStyles = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-transparent text-sm font-medium whitespace-nowrap outline-none select-none transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-150 ease-out-soft focus-visible:ring-4 focus-visible:ring-ring/25 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-invalid:border-danger [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-button hover:bg-primary-hover focus-visible:ring-primary/30",
        outline:
          "border-border-strong bg-card text-foreground shadow-xs hover:border-[#c7c7cc] hover:bg-[#fafafa] aria-expanded:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[#e8e8ed] aria-expanded:bg-[#e8e8ed]",
        ghost:
          "text-foreground hover:bg-muted aria-expanded:bg-muted",
        ink:
          "bg-foreground text-background shadow-button hover:bg-[#333336]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-button hover:bg-[#ab2318] focus-visible:ring-destructive/30",
        "destructive-subtle":
          "border-[#f6d3cf] bg-danger-subtle text-danger hover:border-[#f0b9b2] hover:bg-[#fde3df] focus-visible:ring-destructive/25",
        link: "h-auto rounded-sm px-0 text-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-9 px-3.5",
        xs: "h-7 gap-1 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1.5 rounded-md px-3 text-[0.8125rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 px-5 text-[0.9375rem]",
        xl: "h-12 rounded-xl px-6 text-base",
        icon: "size-9",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonVariantProps = VariantProps<typeof buttonVariantStyles>

/**
 * Variant classes run through tailwind-merge, so a variant's overrides (e.g.
 * outline's border colour, `sm`'s radius) beat the base classes even when this
 * is applied directly to a <Link> instead of via <Button>.
 */
function buttonVariants({
  variant,
  size,
  className,
}: ButtonVariantProps & { className?: string } = {}) {
  return cn(buttonVariantStyles({ variant, size }), className)
}
type ButtonVariant = NonNullable<ButtonVariantProps["variant"]>
type ButtonSize = NonNullable<ButtonVariantProps["size"]>

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & ButtonVariantProps) {
  const base = buttonVariantStyles({ variant, size })

  return (
    <ButtonPrimitive
      data-slot="button"
      // base-ui also accepts a state => className function; merge either form.
      className={
        typeof className === "function"
          ? (state) => cn(base, className(state))
          : cn(base, className)
      }
      {...props}
    />
  )
}

export { Button, buttonVariants, type ButtonVariant, type ButtonSize }
