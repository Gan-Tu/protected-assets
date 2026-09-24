import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * iOS-style toggle built on a native checkbox, so it posts with the form, needs
 * no JavaScript, and is announced as a switch. The thumb is a ::before on the
 * input itself (supported for `appearance: none` in all evergreen browsers).
 */
function Switch({
  className,
  size = "default",
  ...props
}: Omit<React.ComponentProps<"input">, "type" | "size"> & {
  size?: "default" | "sm"
}) {
  return (
    <input
      type="checkbox"
      role="switch"
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer relative inline-flex shrink-0 cursor-pointer appearance-none rounded-full bg-switch-off outline-none transition-colors duration-200 ease-out-soft",
        "h-[26px] w-[44px] data-[size=sm]:h-5 data-[size=sm]:w-[34px]",
        "before:pointer-events-none before:absolute before:top-[2px] before:left-[2px] before:size-[22px] before:rounded-full before:bg-white before:shadow-[0_2px_4px_rgb(0_0_0/0.18),0_0_0_0.5px_rgb(0_0_0/0.06)] before:transition-transform before:duration-200 before:ease-spring before:content-['']",
        "data-[size=sm]:before:size-4",
        "checked:bg-primary checked:before:translate-x-[18px] data-[size=sm]:checked:before:translate-x-[14px]",
        "hover:brightness-[0.97] focus-visible:ring-4 focus-visible:ring-primary/25 active:before:scale-x-110",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Switch }
