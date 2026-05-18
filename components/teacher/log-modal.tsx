"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { logPeriod } from "@/lib/actions/teacher";

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
  const [status, setStatus] = useState<StatusType | null>(
    (periodInstance.status as StatusType) || null
  );
  const [coverageNote, setCoverageNote] = useState(periodInstance.coverage_note || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const date = new Date(periodInstance.date);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const placeholders = {
    done: "Optional — any notes about this period",
    partial: "Required — what was covered and what remains",
    not_done: "Required — reason this period was not conducted",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setStatus(value)}
                  className={`flex flex-col items-center gap-2 py-3 px-2 rounded-lg border-2 transition ${
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
            disabled={isSubmitting || !status}
            className="w-full bg-[#ba2032] hover:bg-[#ba2032]/90"
          >
            {isSubmitting ? "Logging..." : "Log Period"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
