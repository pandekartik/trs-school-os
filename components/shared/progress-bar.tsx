import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressFillVariants = cva("h-full rounded-sm transition-[width]", {
  variants: {
    variant: {
      success: "bg-success",
      warning: "bg-warning",
      error: "bg-error",
      info: "bg-info",
      brand: "bg-brand",
    },
  },
  defaultVariants: {
    variant: "success",
  },
})

function ProgressBar({
  className,
  value,
  max = 100,
  variant = "success",
  showValue = true,
  label,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof progressFillVariants> & {
    value: number
    max?: number
    showValue?: boolean
    label?: string
  }) {
  const percentage = Math.max(0, Math.min(100, Math.round((value / max) * 100)))

  return (
    <div className={cn("flex w-full items-center gap-3", className)} {...props}>
      {label && <span className="text-[13px] text-text-secondary">{label}</span>}
      <div
        className="h-1 flex-1 overflow-hidden rounded-sm bg-surface-3"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(progressFillVariants({ variant }))}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <span className="min-w-10 text-right font-mono text-[11px] font-medium text-text-secondary">
          {percentage}%
        </span>
      )}
    </div>
  )
}

export { ProgressBar, progressFillVariants }
