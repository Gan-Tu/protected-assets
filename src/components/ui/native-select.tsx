import * as React from "react"
import { ChevronsUpDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { fieldControlClass } from "@/components/ui/input"

/**
 * A real <select> (native pickers on mobile, full keyboard support, works in
 * plain form posts) dressed to match Input.
 */
function NativeSelect({
  className,
  wrapperClassName,
  children,
  ...props
}: React.ComponentProps<"select"> & { wrapperClassName?: string }) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <select
        data-slot="native-select"
        className={cn(
          fieldControlClass,
          "h-10 cursor-pointer appearance-none pr-9 pl-3",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronsUpDownIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-subtle-foreground"
      />
    </div>
  )
}

export { NativeSelect }
