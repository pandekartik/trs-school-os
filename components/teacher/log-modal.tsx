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
import { logPeriod } from "@/lib/actions/teacher";
import { cn } from "@/lib/utils";

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
    color: "bg-green-500",
    textColor: "text-green-700",
    bgLight: "bg-green-50",
    borderLight: "border-green-200",
    microcopy: "Lesson completed successfully",
  },
  {
    value: "partial" as StatusType,
    title: "Partial",
    icon: AlertCircle,
    color: "bg-amber-500",
    textColor: "text-amber-700",
    bgLight: "bg-amber-50",
    borderLight: "border-amber-200",
    microcopy: "Only part of lesson completed",
  },
  {
    value: "not_done" as StatusType,
    title: "Not Completed",
    icon: X,
    color: "bg-red-500",
    textColor: "text-red-700",
    bgLight: "bg-red-50",
    borderLight: "border-red-200",
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

  const date = new Date(periodInstance.date);
  const dateStr = date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });

  const selectedStatusOption = STATUS_OPTIONS.find((opt) => opt.value === status);
  const needsNote = status === "partial" || status === "not_done";
  const hasNote = coverageNote.trim().length > 0;

  const placeholders = {
    done: "Optional — any additional notes",
    partial: "What was covered and what remains?",
    not_done: "Why was the lesson not completed?",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg gap-0 p-0 rounded-b-none sm:rounded-b-lg sm:rounded-t-lg rounded-t-2xl sm:rounded-t-lg flex flex-col max-h-[95vh] sm:max-h-none">
        {/* Header */}
        <div className="flex-shrink-0 border-b bg-surface px-6 py-4 sm:py-5">
          <h2 className="text-lg font-semibold">Log Period</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {subject?.name} • {division?.name} • Period {periodInstance.chapter_period_sequence} • {dateStr}
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 sm:py-6 space-y-6">
          {/* Status Selection */}
          <div>
            <label className="text-sm font-semibold block mb-3">Period Outcome</label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {STATUS_OPTIONS.map((option) => {
                const isSelected = status === option.value;
                const Icon = option.icon;

                return (
                  <button
                    key={option.value}
                    onClick={() => setStatus(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 py-4 px-3 sm:px-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                      isSelected
                        ? cn(option.bgLight, option.borderLight, "border-2 shadow-sm")
                        : "border-border hover:border-foreground/30 hover:bg-muted/30"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-full p-2 transition-colors",
                        isSelected ? option.color : "bg-muted"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5",
                          isSelected ? "text-white" : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold leading-tight">{option.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{option.microcopy}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Coverage Note */}
          {status && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-1">
                <label className="text-sm font-semibold">
                  {needsNote ? "Notes *" : "Notes"}
                </label>
                {needsNote && !hasNote && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Required</span>
                )}
                {needsNote && hasNote && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">✓</span>
                )}
              </div>
              <Textarea
                ref={textareaRef}
                placeholder={placeholders[status]}
                value={coverageNote}
                onChange={(e) => setCoverageNote(e.target.value)}
                className="min-h-24 resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {status === "done"
                  ? "Leave blank if nothing to add"
                  : "Please be specific"}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t bg-muted/30 px-6 py-3 sm:py-4 flex gap-2 sm:gap-3">
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
              "flex-1 font-semibold",
              !status || (needsNote && !hasNote)
                ? ""
                : selectedStatusOption?.textColor,
              status && !needsNote && "bg-green-600 hover:bg-green-700",
              status === "partial" && "bg-amber-600 hover:bg-amber-700",
              status === "not_done" && "bg-red-600 hover:bg-red-700"
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

        {/* Keyboard hints */}
        <div className="text-xs text-muted-foreground px-6 py-2 text-center hidden sm:block">
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">1</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono ml-1">2</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono ml-1">3</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono ml-1">Enter</kbd>
        </div>
      </DialogContent>
    </Dialog>
  );
}
