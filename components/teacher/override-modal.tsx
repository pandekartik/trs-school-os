"use client";

import { useState } from "react";
import { AlertCircle, Trash2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PERIOD_TIMES, formatTimeLabel } from "@/lib/timetable-constants";

interface OverrideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: any;
  periodInstance: any;
  existingOverride?: any;
  chapters: any[];
  teachers: any[];
  subject: any;
  division: any;
}

const ACTION_OPTIONS = [
  {
    id: "substitute",
    title: "Assign Substitute",
    description: "Another teacher takes this period",
  },
  {
    id: "cancel",
    title: "Cancel Period",
    description: "Students receive a free period",
  },
  {
    id: "topic_change",
    title: "Change Topic",
    description: "Teach different content",
  },
  {
    id: "chapter_remap",
    title: "Remap Chapter",
    description: "Move lesson to another chapter",
  },
];

export function OverrideModal({
  open,
  onOpenChange,
  slot,
  periodInstance,
  existingOverride,
  chapters,
  teachers,
  subject,
  division,
}: OverrideModalProps) {
  const [overrideType, setOverrideType] = useState<string | null>(
    existingOverride?.override_type || null
  );
  const [substituteTeacherId, setSubstituteTeacherId] = useState(
    existingOverride?.substitute_teacher_id || ""
  );
  const [customTopic, setCustomTopic] = useState(existingOverride?.custom_topic || "");
  const [chapterId, setChapterId] = useState(existingOverride?.chapter_id || "");
  const [reason, setReason] = useState(existingOverride?.reason || "");
  const [saving, setSaving] = useState(false);

  const periodNumber = slot.period_number;
  const periodTime = PERIOD_TIMES.find((p) => p.period === periodNumber);
  const timeLabel = periodTime
    ? `${formatTimeLabel(periodTime.start)} - ${formatTimeLabel(periodTime.end)}`
    : "";
  const date = new Date(periodInstance.date);
  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const isFormValid = reason.trim() && overrideType && (
    overrideType === "substitute" ? !!substituteTeacherId :
    overrideType === "cancel" ? true :
    overrideType === "topic_change" ? !!customTopic :
    overrideType === "chapter_remap" ? !!chapterId :
    false
  );

  const handleSave = async () => {
    if (!isFormValid || !slot) return;

    setSaving(true);
    try {
      const payload: any = {
        timetable_slot_id: slot.id,
        date: periodInstance.date,
        override_type: overrideType,
        reason,
      };

      if (overrideType === "substitute") {
        payload.substitute_teacher_id = substituteTeacherId;
      } else if (overrideType === "topic_change") {
        payload.custom_topic = customTopic;
      } else if (overrideType === "chapter_remap") {
        payload.chapter_id = chapterId;
        payload.chapter_period_number = 1;
      }

      const response = await fetch("/api/period-overrides", {
        method: existingOverride ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(existingOverride && { id: existingOverride.id }),
          ...payload,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      console.error("Error saving override:", error);
      alert("Failed to save override. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!existingOverride || !confirm("Remove this override?")) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/period-overrides/${existingOverride.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      console.error("Error removing override:", error);
      alert("Failed to remove override. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] sm:max-w-[560px]">
        {/* Header */}
        <DialogHeader>
          <DialogTitle>Override Period</DialogTitle>
          <DialogDescription>
            {subject?.name} • {division?.name} • {dateLabel} • {timeLabel}
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(100vh-280px)] px-6">
          <div className="space-y-4 pb-4">
            {/* Step 1: Action Selection */}
            <div>
              <label className="text-sm font-semibold mb-2 block">
                What would you like to do?
              </label>
              <div className="space-y-2">
                {ACTION_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setOverrideType(option.id)}
                    className={`w-full p-3 rounded-md border transition text-left ${
                      overrideType === option.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-surface hover:border-border-strong"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{option.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {option.description}
                        </div>
                      </div>
                      {overrideType === option.id && (
                        <Check className="w-4 h-4 text-primary ml-2 mt-0.5 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Conditional Fields - Only show after action selected */}
            {overrideType && (
              <>
                {/* Substitute Teacher */}
                {overrideType === "substitute" && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Select Teacher *
                    </label>
                    <Select value={substituteTeacherId} onValueChange={setSubstituteTeacherId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose substitute teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((teacher: any) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Cancel Period Info */}
                {overrideType === "cancel" && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      The chapter sequence will shift forward to account for the missed period.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Custom Topic */}
                {overrideType === "topic_change" && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Topic *
                    </label>
                    <Input
                      placeholder="What will you teach instead?"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                    />
                  </div>
                )}

                {/* Chapter Remap */}
                {overrideType === "chapter_remap" && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Move to Chapter *
                    </label>
                    <Select value={chapterId} onValueChange={setChapterId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination chapter" />
                      </SelectTrigger>
                      <SelectContent>
                        {chapters
                          .filter((ch: any) => ch.subject_id === subject?.id)
                          .map((chapter: any) => (
                            <SelectItem key={chapter.id} value={chapter.id}>
                              {chapter.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Reason - Always shown when action selected */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Reason for Change *
                  </label>
                  <Textarea
                    placeholder="Briefly explain why you're making this change"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </>
            )}

            {/* Existing Override Notice */}
            {existingOverride && (
              <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Saving will replace the existing override.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-surface pt-4 px-6 pb-4 flex gap-2 justify-between items-center">
          {existingOverride && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={saving}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remove
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isFormValid || saving}
            >
              {saving ? "Saving..." : "Save Override"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
