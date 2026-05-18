"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableRowProps {
  children: React.ReactNode;
  editForm: React.ReactNode;
  onDelete?: () => void;
  deleteConfirmText?: string;
  className?: string;
}

export function EditableRow({
  children,
  editForm,
  onDelete,
  deleteConfirmText = "Delete?",
  className,
}: EditableRowProps) {
  const [editing, setEditing]       = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (editing) {
    return (
      <div className={cn(
        "flex flex-col gap-4 rounded-[var(--radius-card)] border border-brand-border bg-brand-light p-4",
        className
      )}>
        <div className="flex items-start gap-3">
          <div className="flex-1">{editForm}</div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 mt-0.5"
            onClick={() => setEditing(false)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "group flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3.5 transition-colors hover:bg-surface-2",
      confirming && "border-error-border bg-error-light hover:bg-error-light",
      className
    )}>
      <div className="flex-1 min-w-0">{children}</div>
      <div className="flex shrink-0 items-center gap-1 opacity-45 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        {onDelete && !confirming && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => setConfirming(true)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
        {onDelete && confirming && (
          <>
            <span className="text-[10px] text-destructive font-medium">
              {deleteConfirmText}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md text-destructive hover:bg-destructive/10"
              onClick={() => { setConfirming(false); onDelete(); }}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md"
              onClick={() => setConfirming(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
