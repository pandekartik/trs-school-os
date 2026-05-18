import * as React from "react"
import { AlertCircle, CheckCircle2, Info, TriangleAlert, type LucideIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertCardVariants = cva(
  "flex items-start gap-3 rounded-[var(--radius-card)] border border-l-[3px] px-4 py-3.5",
  {
    variants: {
      variant: {
        info: "border-info-border border-l-info bg-info-light",
        warning: "border-warning-border border-l-warning bg-warning-light",
        error: "border-error-border border-l-error bg-error-light",
        success: "border-success-border border-l-success bg-success-light",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
)

const iconByVariant: Record<NonNullable<VariantProps<typeof alertCardVariants>["variant"]>, LucideIcon> = {
  info: Info,
  warning: TriangleAlert,
  error: AlertCircle,
  success: CheckCircle2,
}

const iconClassByVariant: Record<NonNullable<VariantProps<typeof alertCardVariants>["variant"]>, string> = {
  info: "text-info",
  warning: "text-warning",
  error: "text-error",
  success: "text-success",
}

function AlertCard({
  className,
  variant = "info",
  icon,
  title,
  children,
  action,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof alertCardVariants> & {
    icon?: React.ReactNode
    title: React.ReactNode
    action?: React.ReactNode
  }) {
  const Icon = iconByVariant[variant ?? "info"]

  return (
    <div className={cn(alertCardVariants({ variant }), className)} {...props}>
      <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center", iconClassByVariant[variant ?? "info"])}>
        {icon ?? <Icon className="size-[18px]" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 text-[13px] font-semibold text-foreground">{title}</div>
        <div className="text-[13px] leading-6 text-text-secondary">{children}</div>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  )
}

export { AlertCard, alertCardVariants }
