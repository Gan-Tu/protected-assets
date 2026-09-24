import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Shared by Input, Textarea and NativeSelect so every text control has the same
 * height rhythm, hover, focus halo and invalid state. 16px on mobile stops iOS
 * from zooming into the field on focus.
 */
export const fieldControlClass =
  "w-full min-w-0 rounded-lg border border-input bg-card text-base text-foreground shadow-xs outline-none transition-[border-color,box-shadow,background-color] duration-150 ease-out-soft placeholder:text-placeholder hover:border-input-hover focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:hover:border-input aria-invalid:border-danger aria-invalid:ring-4 aria-invalid:ring-danger/12 aria-invalid:hover:border-danger md:text-sm"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldControlClass,
        "h-10 px-3 file:mr-3 file:inline-flex file:h-7 file:rounded-md file:border-0 file:bg-muted file:px-2.5 file:text-sm file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
