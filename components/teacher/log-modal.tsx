"use client";

<<<<<<< Updated upstream
import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, XCircle, Loader2 } from "lucide-react";
=======
import { useState, useEffect, useRef, useCallback } from "react";
import { Check, AlertCircle, X, BookOpen, Loader2 } from "lucide-react";
>>>>>>> Stashed changes
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
<<<<<<< Updated upstream
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { logPeriod } from "@/lib/actions/teacher";
=======
  DialogTitle,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { logPeriod } from "@/lib/actions/teacher";
import { cn } from "@/lib/utils";
import type { Chapter, ChapterPeriod } from "@/lib/types";
>>>>>>> Stashed changes

type StatusType = "done" | "partial" | "not_done" | "different_content";

interface LogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodInstance: any;
  subject: any;
  division: any;
  loggedBy: string;
  chapters: Chapter[];
  chapterPeriods?: ChapterPeriod[];
  teachers?: any[];
}

interface StatusOption {
  value: StatusType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
<<<<<<< Updated upstream
    value: "done" as StatusType,
    label: "Done",
    icon: CheckCircle,
    color: "text-green-600",
  },
  {
    value: "partial" as StatusType,
    label: "Partial",
    icon: AlertCircle,
    color: "text-amber-600",
  },
  {
    value: "not_done" as StatusType,
    label: "Not done",
    icon: XCircle,
    color: "text-red-600",
=======
    value: "done",
    title: "Completed",
    description: "Lesson completed successfully",
    icon: Check,
  },
  {
    value: "partial",
    title: "Partial",
    description: "Only part of lesson completed",
    icon: AlertCircle,
  },
  {
    value: "not_done",
    title: "Not Completed",
    description: "Lesson could not be conducted",
    icon: X,
  },
  {
    value: "different_content",
    title: "Different Content",
    description: "Different chapter/content taught",
    icon: BookOpen,
>>>>>>> Stashed changes
  },
];

export function LogModal({
  open,
  onOpenChange,
  periodInstance,
  subject,
  division,
  loggedBy,
  chapters,
  chapterPeriods,
  teachers = [],
}: LogModalProps) {
  const [status, setStatus] = useState<StatusType | null>(null);
  const [coverageNote, setCoverageNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
<<<<<<< Updated upstream
=======
  const [overrideChapterId, setOverrideChapterId] = useState("");
  const [overrideChapterPeriodNo, setOverrideChapterPeriodNo] = useState(1);
  const [chapterOverrideNote, setChapterOverrideNote] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overrideNoteRef = useRef<HTMLTextAreaElement>(null);
  const statusSelectorRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback(async () => {
    if (!status) {
      toast.error("Please select a status");
      return;
    }

    if ((status === "partial" || status === "not_done") && !coverageNote.trim()) {
      toast.error("Notes required for this status");
      return;
    }

    if (status === "different_content" && !overrideChapterId) {
      toast.error("Please select a chapter");
      return;
    }

    setIsSubmitting(true);
    try {
      const submitStatus = status === "different_content" ? "done" : status;
      const result = await logPeriod(
        periodInstance.id,
        submitStatus,
        status === "different_content" ? "" : coverageNote,
        loggedBy,
        status === "different_content" ? overrideChapterId : undefined,
        status === "different_content" ? overrideChapterPeriodNo : undefined,
        status === "different_content" ? chapterOverrideNote : undefined
      );

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Period logged successfully");
        onOpenChange(false);
      }
    } catch {
      toast.error("Failed to log period");
    } finally {
      setIsSubmitting(false);
    }
  }, [status, coverageNote, overrideChapterId, overrideChapterPeriodNo, chapterOverrideNote, periodInstance.id, loggedBy, onOpenChange]);
>>>>>>> Stashed changes

  useEffect(() => {
    if (open) {
      if (["done", "partial", "not_done", "different_content"].includes(periodInstance.status)) {
        setStatus(periodInstance.status as StatusType);
      } else {
        setStatus(null);
      }
      setCoverageNote(periodInstance.coverage_note ?? "");
      setOverrideChapterId(periodInstance.override_chapter_id ?? "");
      setOverrideChapterPeriodNo(periodInstance.override_chapter_period_no ?? 1);
      setChapterOverrideNote(periodInstance.chapter_override_note ?? "");
    }
  }, [open, periodInstance]);

<<<<<<< Updated upstream
  const handleSubmit = async () => {
    if (!status) {
      toast.error("Please select a status");
      return;
    }

    if ((status === "partial" || status === "not_done") && !coverageNote.trim()) {
      toast.error("Coverage note is required for this status");
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
=======
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
  }, [open, handleSubmit]);

  // Auto-focus textarea when status changes
  useEffect(() => {
    if (status && (status === "partial" || status === "not_done")) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    } else if (status === "different_content") {
      setTimeout(() => overrideNoteRef.current?.focus(), 100);
    }
  }, [status]);
>>>>>>> Stashed changes

  const date = new Date(periodInstance.date);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

<<<<<<< Updated upstream
  const placeholders = {
    done: "Optional — any notes about this period",
    partial: "Required — what was covered and what remains",
    not_done: "Required — reason this period was not conducted",
=======
  const substituteTeacher = periodInstance.is_substituted && periodInstance.substitute_teacher_id
    ? teachers.find((t) => t.id === periodInstance.substitute_teacher_id)
    : null;

  const needsNote = status === "partial" || status === "not_done";
  const hasNote = coverageNote.trim().length > 0;

  const placeholders: Record<StatusType, string> = {
    done: "Optional — any additional notes",
    partial: "What was covered and what remains?",
    not_done: "Why was the lesson not completed?",
    different_content: "",
  };

  const selectedChapter = overrideChapterId ? chapters.find((ch) => ch.id === overrideChapterId) : null;
  const availablePeriods = selectedChapter ? Array.from({ length: selectedChapter.allocated_periods }, (_, i) => i + 1) : [];

  const handleChapterChange = (newChapterId: string) => {
    setOverrideChapterId(newChapterId);
    setOverrideChapterPeriodNo(1);
  };

  const getStatusCardStyles = (option: StatusOption) => {
    const isSelected = status === option.value;

    if (isSelected) {
      if (option.value === "done") {
        return {
          bg: "bg-[hsl(var(--brand-light))]",
          border: "border-[hsl(var(--brand))]",
          text: "text-[hsl(var(--text-primary))]",
          iconBg: "bg-[hsl(var(--success))]",
          iconColor: "text-white",
        };
      } else if (option.value === "partial") {
        return {
          bg: "bg-[hsl(var(--brand-light))]",
          border: "border-[hsl(var(--brand))]",
          text: "text-[hsl(var(--text-primary))]",
          iconBg: "bg-[hsl(var(--warning))]",
          iconColor: "text-white",
        };
      } else if (option.value === "not_done") {
        return {
          bg: "bg-[hsl(var(--brand-light))]",
          border: "border-[hsl(var(--brand))]",
          text: "text-[hsl(var(--text-primary))]",
          iconBg: "bg-[hsl(var(--error))]",
          iconColor: "text-white",
        };
      } else {
        return {
          bg: "bg-[hsl(var(--brand-light))]",
          border: "border-[hsl(var(--brand))]",
          text: "text-[hsl(var(--text-primary))]",
          iconBg: "bg-[hsl(var(--info))]",
          iconColor: "text-white",
        };
      }
    }

    return {
      bg: "bg-[hsl(var(--surface-2))]",
      border: "border-[hsl(var(--border))]",
      text: "text-[hsl(var(--text-secondary))]",
      iconBg: "bg-[hsl(var(--surface-3))]",
      iconColor: "text-[hsl(var(--text-muted))]",
    };
>>>>>>> Stashed changes
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
<<<<<<< Updated upstream
      <DialogContent className="max-w-md max-h-[85vh] md:max-h-none w-full md:w-auto rounded-b-none md:rounded-b-lg md:rounded-t-lg rounded-t-2xl md:rounded-t-lg">
        <DialogHeader>
          <DialogTitle>Log Period</DialogTitle>
          <DialogDescription>
            {subject?.name} · {dateStr} · Period {periodInstance.chapter_period_sequence}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status selector */}
          <div>
            <label className="text-sm font-medium block mb-2">Status</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {STATUS_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setStatus(value)}
                  className={`flex flex-col items-center gap-2 py-3 px-2 rounded-lg border-2 transition min-h-[60px] md:min-h-auto ${
                    status === value
                      ? "border-[#ba2032] bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${color}`} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Coverage note */}
          <div>
            <label className="text-sm font-medium block mb-2">
              {status && (status === "partial" || status === "not_done")
                ? "Coverage Note *"
                : "Coverage Note"}
            </label>
            <Textarea
              placeholder={status ? placeholders[status] : "Select a status first"}
              value={coverageNote}
              onChange={(e) => setCoverageNote(e.target.value)}
              className="min-h-20 resize-none"
              disabled={!status}
            />
          </div>

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !status || (status && (status === "partial" || status === "not_done") && !coverageNote.trim())}
            className="w-full bg-[#ba2032] hover:bg-[#ba2032]/90"
=======
      <DialogContent className="w-full max-w-2xl gap-0 p-0 rounded-b-none sm:rounded-b-[var(--radius-modal)] sm:rounded-t-[var(--radius-modal)] rounded-t-3xl sm:rounded-t-[var(--radius-modal)] flex flex-col max-h-[95vh] sm:max-h-none">
        <DialogTitle className="sr-only">Log Period</DialogTitle>

        {/* Header */}
        <DialogHeader className="gap-1.5 border-b border-border px-6 pt-6 pb-4 sm:pb-5">
          <h2 className="text-xl font-semibold">Log Period</h2>
          <p className="text-sm text-text-muted">
            <span className="font-medium text-text-secondary">{subject?.name}</span>
            {" • "}
            <span>{division?.name}</span>
            {" • "}
            <span>Period {periodInstance.chapter_period_sequence}</span>
            {" • "}
            <span>{dateStr}</span>
          </p>
          {periodInstance.is_substituted && substituteTeacher && (
            <div className="mt-2 pt-3 border-t border-border">
              <p className="text-xs text-text-muted">
                <span className="font-medium text-text-secondary">Substitute Teacher:</span>
                {" "}
                <span>{substituteTeacher.name}</span>
              </p>
            </div>
          )}
        </DialogHeader>

        {/* Body */}
        <DialogBody className="flex-1 overflow-y-auto space-y-6">
          {/* Status Selector */}
          <div ref={statusSelectorRef}>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Period Outcome</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {STATUS_OPTIONS.map((option) => {
                const styles = getStatusCardStyles(option);
                const Icon = option.icon;
                const isSelected = status === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => setStatus(option.value)}
                    role="radio"
                    aria-checked={isSelected}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-[var(--radius-card)] border-2 transition-all duration-200 cursor-pointer",
                      "hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:border-primary",
                      styles.bg,
                      styles.border,
                      styles.text
                    )}
                  >
                    <div className={cn("rounded-full p-2.5 transition-colors", styles.iconBg)}>
                      <Icon className={cn("w-5 h-5", styles.iconColor)} />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold leading-tight">{option.title}</div>
                      <div className={cn("text-xs mt-1", isSelected ? "text-text-secondary" : "text-text-muted")}>
                        {option.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Coverage Note - shown for done, partial, not_done */}
          {status && status !== "different_content" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <Label className="font-semibold text-sm text-text-primary">
                {needsNote ? (
                  <>
                    Notes <span className="text-destructive">*</span>
                  </>
                ) : (
                  "Notes"
                )}
              </Label>
              <Textarea
                ref={textareaRef}
                placeholder={placeholders[status]}
                value={coverageNote}
                onChange={(e) => setCoverageNote(e.target.value)}
                className="min-h-20 resize-vertical text-sm border-border focus:border-primary"
              />
              <p className="text-xs text-text-muted">
                {status === "done"
                  ? "Leave blank if nothing to add"
                  : "Please be specific about what occurred"}
              </p>
            </div>
          )}

          {/* Different Content Fields */}
          {status === "different_content" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Chapter Select */}
              <div className="space-y-2">
                <Label className="font-semibold text-sm text-text-primary">
                  Chapter Taught <span className="text-destructive">*</span>
                </Label>
                <select
                  value={overrideChapterId}
                  onChange={(e) => handleChapterChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-[var(--radius-input)] border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select a chapter</option>
                  {chapters
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((chapter) => (
                      <option key={chapter.id} value={chapter.id}>
                        Ch {chapter.chapter_number} — {chapter.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Period Select */}
              <div className="space-y-2">
                <Label className="font-semibold text-sm text-text-primary">
                  Period {!overrideChapterId && <span className="text-text-muted">(select chapter first)</span>}
                </Label>
                <select
                  value={overrideChapterPeriodNo}
                  onChange={(e) => setOverrideChapterPeriodNo(parseInt(e.target.value))}
                  disabled={!overrideChapterId}
                  className="w-full h-9 px-3 rounded-[var(--radius-input)] border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select a period</option>
                  {availablePeriods.map((periodNo) => (
                    <option key={periodNo} value={periodNo}>
                      Period {periodNo} of {selectedChapter?.allocated_periods}
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Note */}
              <div className="space-y-2">
                <Label className="font-semibold text-sm text-text-primary">
                  Notes <span className="text-text-muted text-xs font-normal">(optional)</span>
                </Label>
                <Textarea
                  ref={overrideNoteRef}
                  placeholder="Why did the content differ from the scheduled plan?"
                  value={chapterOverrideNote}
                  onChange={(e) => setChapterOverrideNote(e.target.value)}
                  className="min-h-20 resize-vertical text-sm border-border focus:border-primary"
                />
              </div>
            </div>
          )}
        </DialogBody>

        {/* Footer */}
        <DialogFooter className="gap-3 border-t border-border px-6 py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !status ||
              (needsNote && !hasNote) ||
              (status === "different_content" && !overrideChapterId)
            }
>>>>>>> Stashed changes
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Log period"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
