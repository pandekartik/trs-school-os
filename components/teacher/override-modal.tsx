"use client";

import { useState } from "react";
import { AlertCircle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const OVERRIDE_TYPES = [
  { id: "substitute", label: "Assign Substitute", icon: "👤" },
  { id: "cancel", label: "Cancel Period", icon: "❌" },
  { id: "topic_change", label: "Change Topic", icon: "📝" },
  { id: "chapter_remap", label: "Remap Chapter", icon: "📚" },
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
  const [chapterPeriodNumber, setChapterPeriodNumber] = useState(
    existingOverride?.chapter_period_number || 1
  );
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

  const selectedChapter = chapters.find((c) => c.id === chapterId);
  const maxChapterPeriods = selectedChapter?.allocated_periods || 1;

  const isFormValid = reason.trim() && overrideType && (
    overrideType === "substitute" ? !!substituteTeacherId :
    overrideType === "cancel" ? true :
    overrideType === "topic_change" ? !!customTopic :
    overrideType === "chapter_remap" ? !!chapterId && !!chapterPeriodNumber :
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
        payload.chapter_period_number = chapterPeriodNumber;
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
      // Optionally refresh the page or trigger a refetch
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Override Period</DialogTitle>
          <DialogDescription>
            {subject?.name} • {dateLabel} • {timeLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Override type selector */}
          <div>
            <label className="text-sm font-medium mb-3 block">Override Type</label>
            <div className="grid grid-cols-2 gap-3">
              {OVERRIDE_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setOverrideType(type.id)}
                  className={`p-3 rounded-lg border-2 transition ${
                    overrideType === type.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className="text-sm font-medium text-left">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Substitute teacher selector */}
          {overrideType === "substitute" && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Substitute Teacher
              </label>
              <Select value={substituteTeacherId} onValueChange={setSubstituteTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
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

          {/* Cancel period info */}
          {overrideType === "cancel" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This period will be marked as cancelled. The chapter sequence will shift to
                account for the missed period.
              </AlertDescription>
            </Alert>
          )}

          {/* Custom topic */}
          {overrideType === "topic_change" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Custom Topic</label>
              <Input
                placeholder="Enter custom topic"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
              />
            </div>
          )}

          {/* Chapter remap */}
          {overrideType === "chapter_remap" && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Chapter</label>
                <Select value={chapterId} onValueChange={setChapterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select chapter" />
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
              <div>
                <label className="text-sm font-medium mb-2 block">Period Number</label>
                <Input
                  type="number"
                  min="1"
                  max={maxChapterPeriods}
                  value={chapterPeriodNumber}
                  onChange={(e) => setChapterPeriodNumber(parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max: {maxChapterPeriods}
                </p>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-sm font-medium mb-2 block">Reason *</label>
            <Textarea
              placeholder="Explain why this override is needed"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Existing override notice */}
          {existingOverride && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                An override already exists for this period. Saving will replace it.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2 justify-between">
          {existingOverride && (
            <Button
              variant="destructive"
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
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isFormValid || saving}
            >
              {saving ? "Saving..." : "Save Override"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
