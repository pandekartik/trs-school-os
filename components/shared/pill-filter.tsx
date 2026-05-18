"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type PillFilterOption = {
  label: React.ReactNode
  value: string
  disabled?: boolean
}

function PillFilter({
  className,
  label,
  options,
  value,
  onValueChange,
}: {
  className?: string
  label?: React.ReactNode
  options: PillFilterOption[]
  value?: string
  onValueChange?: (value: string) => void
}) {
  return (
    <div className={cn("flex items-center gap-1 overflow-x-auto pb-1", className)}>
      {label && (
        <span className="mr-2 self-center px-3 font-mono text-[10px] tracking-[0.06em] text-text-muted uppercase">
          {label}
        </span>
      )}
      {options.map((option) => {
        const selected = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            disabled={option.disabled}
            aria-pressed={selected}
            className={cn(
              "inline-flex h-7 shrink-0 items-center rounded-[var(--radius-button)] border border-transparent px-3 text-xs font-medium whitespace-nowrap text-text-secondary transition-colors hover:bg-surface-2 hover:text-foreground disabled:cursor-not-allowed disabled:text-text-disabled",
              selected && "bg-foreground text-background hover:bg-foreground hover:text-background"
            )}
            onClick={() => onValueChange?.(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export { PillFilter, type PillFilterOption }
