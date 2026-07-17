"use client";

import { useState, useEffect, useRef } from "react";
import { Check, AlertCircle, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { logPeriod } from "@/lib/actions/teacher";
import { cn } from "@/lib/utils";
import { formatDateOnly } from "@/lib/utils/date";

type StatusType = "done" | "partial" | "not_done";

interface LogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodInstance: any;
  subject: any;
  division: any;
  standard: any;
  loggedBy: string;
}

const STATUS_OPTIONS = [
  {
    value: "done" as StatusType,
    title: "Completed",
    icon: Check,
    variantClass: "success",
    microcopy: "Lesson completed successfully",
  },
  {
    value: "partial" as StatusType,
    title: "Partial",
    icon: AlertCircle,
    variantClass: "warning",
    microcopy: "Only part of lesson completed",
  },
  {
    value: "not_done" as StatusType,
    title: "Not Completed",
    icon: X,
    variantClass: "error",
    microcopy: "Lesson could not be conducted",
  },
];

export function LogModal({
  open,
  onOpenChange,
  periodInstance,
  subject,
  division,
  standard,
  loggedBy,
}: LogModalProps) {
  const [status, setStatus] = useState<StatusType | null>(null);
  const [coverageNote, setCoverageNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      if (["done", "partial", "not_done"].includes(periodInstance.status)) {
        setStatus(periodInstance.status as StatusType);
      } else {
        setStatus(null);
      }
      setCoverageNote(periodInstance.coverage_note ?? "");
    }
  }, [open, periodInstance]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "1") setStatus("done");
      if (e.key === "2") setStatus("partial");
      if (e.key === "3") setStatus("not_done");
      if (e.key === "Enter" && e.ctrlKey) handleSubmit();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, status, coverageNote]);

  // Auto-focus textarea when status changes
  useEffect(() => {
    if (status && (status === "partial" || status === "not_done")) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [status]);

  const handleSubmit = async () => {
    if (!status) {
      toast.error("Please select a status");
      return;
    }

    if ((status === "partial" || status === "not_done") && !coverageNote.trim()) {
      toast.error("Notes required for this status");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await logPeriod(
        periodInstance.id,
        status,
        coverageNote,
        loggedBy
      );

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Period logged successfully");
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("Failed to log period");
    } finally {
      setIsSubmitting(false);
    }
  };

  const dateStr = formatDateOnly(periodInstance.date, { month: "short", day: "numeric" }, "en-IN");

  const selectedStatusOption = STATUS_OPTIONS.find((opt) => opt.value === status);
  const needsNote = status === "partial" || status === "not_done";
  const hasNote = coverageNote.trim().length > 0;

  const placeholders = {
    done: "Optional — any additional notes",
    partial: "What was covered and what remains?",
    not_done: "Why was the lesson not completed?",
  };

  const statusVariantMap: Record<string, "success" | "warning" | "error"> = {
    success: "success",
    warning: "warning",
    error: "error",
  };

  const buttonVariantMap: Record<string, string> = {
    done: "bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))] text-white",
    partial: "bg-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))] text-white",
    not_done: "bg-[hsl(var(--error))] hover:bg-[hsl(var(--error))] text-white",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg gap-0 p-0 rounded-b-none sm:rounded-b-lg sm:rounded-t-lg rounded-t-2xl sm:rounded-t-lg flex flex-col max-h-[95vh] sm:max-h-none">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-6 py-4 sm:py-5">
          <h2 className="text-lg font-semibold text-[hsl(var(--text-primary))]">Log Period</h2>
          <p className="text-sm text-[hsl(var(--text-muted))] mt-1">
            {subject?.name} • {division?.name} • Period {periodInstance.chapter_period_sequence} • {dateStr}
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 sm:py-6 space-y-6">
          {/* Status Selection */}
          <div>
            <label className="text-sm font-semibold text-[hsl(var(--text-primary))] block mb-3">
              Period Outcome
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {STATUS_OPTIONS.map((option) => {
                const isSelected = status === option.value;
                const Icon = option.icon;

                let bgColor = "bg-[hsl(var(--surface-2))]";
                let borderColor = "border-[hsl(var(--border))]";
                let textColor = "text-[hsl(var(--text-secondary))]";
                let iconBgColor = "bg-[hsl(var(--surface-3))]";
                let iconColor = "text-[hsl(var(--text-muted))]";

                if (isSelected) {
                  if (option.variantClass === "success") {
                    bgColor = "bg-[hsl(var(--success-light))]";
                    borderColor = "border-[hsl(var(--success-border))]";
                    textColor = "text-[hsl(var(--text-primary))]";
                    iconBgColor = "bg-[hsl(var(--success))]";
                    iconColor = "text-white";
                  } else if (option.variantClass === "warning") {
                    bgColor = "bg-[hsl(var(--warning-light))]";
                    borderColor = "border-[hsl(var(--warning-border))]";
                    textColor = "text-[hsl(var(--text-primary))]";
                    iconBgColor = "bg-[hsl(var(--warning))]";
                    iconColor = "text-white";
                  } else if (option.variantClass === "error") {
                    bgColor = "bg-[hsl(var(--error-light))]";
                    borderColor = "border-[hsl(var(--error-border))]";
                    textColor = "text-[hsl(var(--text-primary))]";
                    iconBgColor = "bg-[hsl(var(--error))]";
                    iconColor = "text-white";
                  }
                }

                return (
                  <button
                    key={option.value}
                    onClick={() => setStatus(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 py-4 px-3 sm:px-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                      bgColor,
                      borderColor
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-full p-2 transition-colors",
                        iconBgColor
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5",
                          iconColor
                        )}
                      />
                    </div>
                    <div className="text-center">
                      <div className={cn("text-sm font-semibold leading-tight", textColor)}>
                        {option.title}
                      </div>
                      <div className="text-xs text-[hsl(var(--text-muted))] mt-0.5">
                        {option.microcopy}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Coverage Note */}
          {status && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-[hsl(var(--text-primary))]">
                  {needsNote ? "Notes *" : "Notes"}
                </label>
                {needsNote && !hasNote && (
                  <Badge variant="error" className="text-xs">
                    Required
                  </Badge>
                )}
                {needsNote && hasNote && (
                  <Badge variant="success" className="text-xs">
                    ✓
                  </Badge>
                )}
              </div>
              <Textarea
                ref={textareaRef}
                placeholder={placeholders[status]}
                value={coverageNote}
                onChange={(e) => setCoverageNote(e.target.value)}
                className="min-h-24 resize-none text-sm"
              />
              <p className="text-xs text-[hsl(var(--text-muted))]">
                {status === "done"
                  ? "Leave blank if nothing to add"
                  : "Please be specific"}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-6 py-3 sm:py-4 flex gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !status ||
              (needsNote && !hasNote)
            }
            className={cn(
              "flex-1 font-semibold text-white",
              status === "done" && "bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]",
              status === "partial" && "bg-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]",
              status === "not_done" && "bg-[hsl(var(--error))] hover:bg-[hsl(var(--error))]",
              (!status || (needsNote && !hasNote)) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving
              </>
            ) : (
              "Save Log"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
