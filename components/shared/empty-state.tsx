import * as React from "react"

import { cn } from "@/lib/utils"

function EmptyState({
  className,
  icon,
  title,
  children,
  action,
  ...props
}: React.ComponentProps<"div"> & {
  icon?: React.ReactNode
  title: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex min-h-44 flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border bg-surface px-6 py-8 text-center",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-surface-2 text-text-muted [&_svg]:size-5">
          {icon}
        </div>
      )}
      <div className="text-[13px] font-semibold text-foreground">{title}</div>
      {children && (
        <div className="mt-1 max-w-sm text-[13px] leading-6 text-text-muted">
          {children}
        </div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export { EmptyState }
