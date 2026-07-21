"use client";

import { useState, useEffect, useRef } from "react";
import { Check, AlertCircle, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { markAttendance } from "@/lib/actions/teacher";
import { cn } from "@/lib/utils";

type StatusType = "present" | "absent" | "late" | "half_day";

interface AttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
  teacherName: string;
  date: string;
  currentStatus?: StatusType | null;
  currentReason?: string | null;
  markedBy: string;
  branchId: string;
  onSuccess?: () => void;
}

const STATUS_OPTIONS = [
  {
    value: "present" as StatusType,
    title: "Present",
    icon: Check,
    variantColor: "success",
    microcopy: "Teacher was present",
  },
  {
    value: "absent" as StatusType,
    title: "Absent",
    icon: X,
    variantColor: "error",
    microcopy: "Teacher was absent",
  },
  {
    value: "late" as StatusType,
    title: "Late",
    icon: AlertCircle,
    variantColor: "warning",
    microcopy: "Teacher arrived late",
  },
  {
    value: "half_day" as StatusType,
    title: "Half Day",
    icon: AlertCircle,
    variantColor: "info",
    microcopy: "Teacher left early",
  },
];

export function AttendanceModal({
  open,
  onOpenChange,
  teacherId,
  teacherName,
  date,
  currentStatus,
  currentReason,
  markedBy,
  branchId,
  onSuccess,
}: AttendanceModalProps) {
  const [status, setStatus] = useState<StatusType | null>(currentStatus ?? null);
  const [reason, setReason] = useState(currentReason ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setStatus(currentStatus ?? null);
      setReason(currentReason ?? "");
    }
  }, [open, currentStatus, currentReason]);

  // Auto-focus textarea when status requires reason
  useEffect(() => {
    if (open && status && (status === "absent" || status === "late")) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [status, open]);

  const handleSubmit = async () => {
    if (!status) {
      toast.error("Please select attendance status");
      return;
    }

    if ((status === "absent" || status === "late") && !reason.trim()) {
      toast.error("Reason required for this status");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("teacher_id", teacherId);
      formData.append("date", date);
      formData.append("status", status);
      formData.append("reason", reason);
      formData.append("marked_by", markedBy);
      formData.append("branch_id", branchId);

      const result = await markAttendance(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Attendance marked");
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      toast.error("Failed to mark attendance");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStatusOption = STATUS_OPTIONS.find((opt) => opt.value === status);
  const needsReason = status === "absent" || status === "late";
  const hasReason = reason.trim().length > 0;

  const placeholders = {
    present: "Optional — any notes",
    absent: "Why was the teacher absent?",
    late: "How late did the teacher arrive?",
    half_day: "When did the teacher leave?",
  };

  const dateStr = new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg gap-0 p-0 rounded-b-none sm:rounded-b-lg sm:rounded-t-lg rounded-t-2xl sm:rounded-t-lg flex flex-col max-h-[95vh] sm:max-h-none">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4 sm:py-5 space-y-1">
          <DialogTitle className="text-lg font-semibold text-[var(--text-primary)]">Mark Attendance</DialogTitle>
          <DialogDescription className="text-sm text-[var(--text-muted)]">
            {teacherName} • {dateStr}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 sm:py-6 space-y-6">
          {/* Status Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-[var(--text-primary)]">
              Attendance Status
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {STATUS_OPTIONS.map((option) => {
                const isSelected = status === option.value;
                const Icon = option.icon;
                const colorMap: Record<string, { bg: string; border: string; lightBg: string; lightBorder: string }> = {
                  success: {
                    bg: "bg-[var(--success)]",
                    border: "border-[var(--success-border)]",
                    lightBg: "bg-[var(--success-light)]",
                    lightBorder: "border-[var(--success-border)]",
                  },
                  error: {
                    bg: "bg-[var(--error)]",
                    border: "border-[var(--error-border)]",
                    lightBg: "bg-[var(--error-light)]",
                    lightBorder: "border-[var(--error-border)]",
                  },
                  warning: {
                    bg: "bg-[var(--warning)]",
                    border: "border-[var(--warning-border)]",
                    lightBg: "bg-[var(--warning-light)]",
                    lightBorder: "border-[var(--warning-border)]",
                  },
                  info: {
                    bg: "bg-[var(--info)]",
                    border: "border-[var(--info-border)]",
                    lightBg: "bg-[var(--info-light)]",
                    lightBorder: "border-[var(--info-border)]",
                  },
                };

                const colors = colorMap[option.variantColor];

                return (
                  <Button
                    key={option.value}
                    variant="outline"
                    onClick={() => setStatus(option.value)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 h-auto py-4 px-3 sm:px-4 transition-all duration-200",
                      isSelected
                        ? cn(colors.lightBg, "border-2", colors.lightBorder, "shadow-sm")
                        : "border-[var(--border)]"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-full p-2 transition-colors",
                        isSelected ? colors.bg : "bg-[var(--surface-3)]"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5",
                          isSelected ? "text-white" : "text-[var(--text-muted)]"
                        )}
                      />
                    </div>
                    <div className="text-center">
                      <div className={cn("text-sm font-semibold leading-tight", isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]")}>
                        {option.title}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {option.microcopy}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Reason/Notes */}
          {status && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  {needsReason ? "Reason *" : "Notes"}
                </label>
                {needsReason && !hasReason && (
                  <Badge variant="error" className="text-xs">
                    Required
                  </Badge>
                )}
                {needsReason && hasReason && (
                  <Badge variant="success" className="text-xs">
                    ✓
                  </Badge>
                )}
              </div>
              <Textarea
                ref={textareaRef}
                placeholder={placeholders[status]}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-20 resize-none text-sm"
              />
              <p className="text-xs text-[var(--text-muted)]">
                {status === "present"
                  ? "Leave blank if nothing to add"
                  : "Please be specific"}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-[var(--border)] bg-[var(--surface-2)] px-6 py-3 sm:py-4 flex gap-2 sm:gap-3">
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
              (needsReason && !hasReason)
            }
            variant={
              status === "present"
                ? "default"
                : status === "absent"
                  ? "destructive"
                  : "default"
            }
            className={cn(
              "flex-1 font-semibold",
              status === "late" && "bg-[var(--warning)] hover:bg-[var(--warning)] text-white",
              status === "half_day" && "bg-[var(--info)] hover:bg-[var(--info)] text-white"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving
              </>
            ) : (
              "Mark Attendance"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
