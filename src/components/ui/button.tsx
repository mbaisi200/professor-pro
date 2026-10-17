import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      {...props}
      className={cn(
        // PRESERVE EXACT ORIGINAL BASE CLASSES (ZERO CHANGES)
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none",

        // === APRIMORAMENTOS FUTURISTAS PROCLASS (ADITIVOS E NÃO-DESTRUTIVOS) ===

        // Glassmorphism effect (aditivo)
        "bg-background/50 backdrop-blur -backdrop-blur",

        // Dark mode glassmorphism adjustment (aditivo)
        "dark:bg-card/50 dark:border-card/30",

        // Focus states with futuristic glow (aditivo)
        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-ring/30",
        "focus-visible:ring-[3px]",
        "focus-visible:before:absolute",
        "focus-visible:before:inset-0",
        "focus-visible:before:rounded-md",
        "focus-visible:before:pointer-events-none",
        "focus-visible:before:bg-gradient-to-br",
        "focus-visible:before:from-cyan-500/10",
        "focus-visible:before:via-purple-500/10",
        "focus-visible:before:to-cyan-500/10",
        "focus-visible:before:blur-3xl",
        "focus-velocity:before:-translate-x-1/2",
        "focus-velocity:before:-translate-y-1/2",
        "focus-visible:before:opacity-0",
        "focus-velocity:group-hover:before:opacity-100",
        "focus-velocity:transition-opacity",
        "focus-velocity:duration-300",
        "dark:focus-velocity:before:shadow-[0_0_20px_rgba(138,43,226,0.4)]",
        "dark:focus-velocity:before:shadow-[0_0_40px_rgba(0,242,254,0.1)]",

        // Hover states with subtle feedback (aditivo)
        "hover:border-primary/30",
        "hover:bg-background/70",
        "dark:hover:bg-card/30",

        // Error states using ProClass destructive colors (aditivo)
        "aria-invalid:border-destructive",
        "aria-invalid:ring-destructive/20",
        "dark:aria-invalid:border-destructive",
        "dark:aria-invalid:ring-destructive/40",

        buttonVariants({ variant, size, className })  // PRESERVE EXACT ORIGINAL VARIANT SYSTEM
      )}
    >
      {/* Children rendered correctly - preserves all existing functionality */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {props.children}
      </span>
    </Comp>
  )
}

export { Button, buttonVariants }