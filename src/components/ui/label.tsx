"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        // Base styles
        "block",
        "mb-2",
        "text-sm",
        "font-medium",

        // Text colors
        "text-foreground/80",
        "dark:text-foreground/60",

        // Hover effects
        "hover:text-foreground",
        "dark:hover:text-foreground/80",
        "transition-colors",
        "duration-200",

        // Futuristic touches
        "relative",
        "pb-1",

        // Optional accent line
        "after:content-['']",
        "after:absolute",
        "after:-bottom-0",
        "after:left-0",
        "after:h-0.5",
        "after:w-0",
        "after:transition-all",
        "after:duration-300",
        "hover:after:w-full",
        "after:bg-gradient-to-r",
        "after:from-cyan-500",
        "after:to-purple-500",
        "after:dark:from-purple-500",
        "after:dark:to-cyan-500",

        // Allow custom overrides
        className
      )}
      {...props}
    />
  )
}

export { Label }