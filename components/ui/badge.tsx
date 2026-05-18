import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-[22px] w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-[var(--radius-badge)] border border-transparent px-2 text-[11px] font-medium leading-none whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-brand-hover",
        secondary:
          "bg-surface-2 text-text-secondary [a]:hover:bg-surface-3",
        destructive:
          "border-error-border bg-error-light text-error focus-visible:ring-destructive/20 [a]:hover:bg-error-light",
        outline:
          "border-border-strong bg-transparent font-mono text-text-secondary [a]:hover:bg-surface-2",
        ghost:
          "text-text-secondary hover:bg-surface-2 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        neutral: "bg-surface-2 text-text-secondary",
        success: "border-success-border bg-success-light text-success",
        warning: "border-warning-border bg-warning-light text-warning",
        error: "border-error-border bg-error-light text-error",
        info: "border-info-border bg-info-light text-info",
        brand: "border-brand-border bg-brand-light text-brand",
        admin: "border-brand-border bg-brand-light text-brand",
        coordinator: "border-info-border bg-info-light text-info",
        teacher: "border-success-border bg-success-light text-success",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
