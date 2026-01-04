import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium animate-physics disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border border-transparent",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hard-shadow hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_var(--color-border)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_var(--color-border)] dark:hover:translate-x-0 dark:hover:translate-y-0 dark:hover:shadow-none dark:active:translate-x-0 dark:active:translate-y-0 dark:active:shadow-none",
        destructive:
          "bg-destructive text-white hard-shadow hover:bg-destructive/90 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_var(--color-border)] active:translate-x-[2px] active:translate-y-[2px] active:scale-100 dark:hover:translate-x-0 dark:hover:translate-y-0 dark:hover:shadow-none dark:active:translate-x-0 dark:active:translate-y-0",
        outline:
          "border border-border bg-background hard-shadow-sm hover:bg-accent hover:text-accent-foreground hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_var(--color-border)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:hover:translate-x-0 dark:hover:translate-y-0 dark:hover:shadow-none dark:active:translate-x-0 dark:active:translate-y-0",
        secondary:
          "bg-secondary text-secondary-foreground hard-shadow-sm hover:bg-secondary/80 active:translate-x-[1px] active:translate-y-[1px] dark:hover:translate-x-0 dark:hover:translate-y-0 dark:active:translate-x-0 dark:active:translate-y-0",
        ghost:
          "hover:bg-accent hover:text-accent-foreground hover:border-border border border-transparent",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
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
  variant = "default",
  size = "default",
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
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
