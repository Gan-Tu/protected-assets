"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Apple-style segmented control over native radios: arrow keys, focus and
 * screen-reader semantics come from the platform. The selected pill is a
 * raised white surface on a recessed track.
 */
function SegmentedControl<T extends string>({
  name,
  value,
  onValueChange,
  options,
  className,
  size = "default",
  "aria-label": ariaLabel,
}: {
  name: string
  value: T
  onValueChange: (value: T) => void
  options: ReadonlyArray<{ value: T; label: React.ReactNode; icon?: React.ReactNode }>
  className?: string
  size?: "default" | "sm"
  "aria-label"?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      data-slot="segmented-control"
      data-size={size}
      className={cn(
        "inline-grid auto-cols-fr grid-flow-col gap-0.5 rounded-[0.625rem] bg-[#ebebef] p-[3px]",
        className
      )}
    >
      {options.map((option) => (
        <label key={option.value} className="relative min-w-0">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onValueChange(option.value)}
            className="peer sr-only"
          />
          <span
            className={cn(
              "flex cursor-pointer items-center justify-center gap-1.5 truncate rounded-[0.5rem] px-3 font-medium text-muted-foreground transition-[color,background-color,box-shadow] duration-150 ease-out-soft select-none hover:text-foreground",
              "peer-checked:bg-card peer-checked:text-foreground peer-checked:shadow-[0_1px_2px_rgb(17_17_26/0.08),0_0_0_0.5px_rgb(17_17_26/0.06)]",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40",
              "[&_svg]:size-3.5 [&_svg]:shrink-0",
              size === "sm" ? "h-7 text-xs" : "h-8 text-[0.8125rem]"
            )}
          >
            {option.icon}
            {option.label}
          </span>
        </label>
      ))}
    </div>
  )
}

export { SegmentedControl }
