"use client";

import { ReactNode, useMemo, useState, useTransition, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  clearTimetableSlot,
  saveTimetableSlot,
} from "@/lib/actions/timetable";
import type {
  Division,
  Subject,
  Teacher,
  TeacherAssignment,
  TemplateSlot,
  TimetableSlot,
} from "@/lib/types";

type SlotPopoverProps = {
  children: ReactNode;
  division: Division;
  day: string;
  slot: TemplateSlot;
  savedSlot: TimetableSlot | null;
  subjects: Subject[];
  teachers: Teacher[];
  teacherAssignments: TeacherAssignment[];
  openSlotId?: string | null;
  onOpenChange?: (slotId: string | null) => void;
};

const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export function SlotPopover({
  children,
  division,
  day,
  slot,
  savedSlot,
  subjects,
  teachers,
  teacherAssignments,
  openSlotId,
  onOpenChange,
}: SlotPopoverProps) {
  const slotKey = `${division.id}-${slot.id}-${day}`;
  const open = openSlotId === slotKey;
  const containerRef = useRef<HTMLDivElement>(null);
  const [positionBottom, setPositionBottom] = useState(false);
  const [subjectId, setSubjectId] = useState(savedSlot?.subject_id ?? "");
  const [teacherId, setTeacherId] = useState(savedSlot?.teacher_id ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // Check if there's enough space below for the popover (estimate ~200px)
      setPositionBottom(rect.bottom + 200 > window.innerHeight);
    }
  }, [open]);

  const divisionSubjects = subjects
    .filter((subject) => subject.standard_id === division.standard_id)
    .sort((a, b) => a.name.localeCompare(b.name));
  const allocatedTeacherIds = useMemo(() => {
    if (!subjectId) return [];
    return teacherAssignments
      .filter((assignment) => assignment.subject_id === subjectId && assignment.division_id === division.id)
      .map((assignment) => assignment.teacher_id);
  }, [division.id, subjectId, teacherAssignments]);
  const teacherOptions = allocatedTeacherIds.length > 0
    ? teachers.filter((teacher) => allocatedTeacherIds.includes(teacher.id))
    : teachers.filter((teacher) => teacher.is_active);

  function handleSave() {
    const formData = new FormData();
    formData.set("division_id", division.id);
    formData.set("template_slot_id", slot.id);
    formData.set("subject_id", subjectId);
    formData.set("teacher_id", teacherId);
    formData.set("day_of_week", day);

    startTransition(async () => {
      const result = await saveTimetableSlot(formData);
      if (result?.error) {
        toast.error("Could not save slot", { description: result.error });
        return;
      }
      toast.success("Slot saved");
      onOpenChange?.(null);
    });
  }

  function handleClear() {
    startTransition(async () => {
      const result = await clearTimetableSlot(division.id, slot.id, day);
      if (result?.error) {
        toast.error("Could not clear slot", { description: result.error });
        return;
      }
      toast.success("Slot cleared");
      onOpenChange?.(null);
    });
  }

  return (
    <div ref={containerRef} className="relative" onClick={() => onOpenChange?.(slotKey)}>
      {children}
      {open && (
        <div
          className={`absolute left-2 z-50 w-[280px] rounded-lg border border-[#E5E5E5] bg-white p-3 shadow-[0_4px_16px_rgba(0,0,0,0.08)] ${
            positionBottom ? "bottom-2" : "top-2"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-3 border-b border-[#F5F5F5] pb-2">
            <div className="text-sm font-semibold text-[#171717]">
              {slot.name} · {DAY_LABELS[day.toLowerCase()] ?? day}
            </div>
            <div className="mt-0.5 text-xs text-[#737373]">{slot.start_time}–{slot.end_time}</div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium uppercase text-[#A3A3A3]">Subject</Label>
              <Select
                value={subjectId}
                onValueChange={(value) => {
                  setSubjectId(value);
                  const allocated = teacherAssignments.find(
                    (assignment) => assignment.subject_id === value && assignment.division_id === division.id
                  );
                  setTeacherId(allocated?.teacher_id ?? "");
                }}
              >
                <SelectTrigger className="h-8 rounded-md border-[#D4D4D4]">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {divisionSubjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium uppercase text-[#A3A3A3]">Teacher</Label>
              <Select value={teacherId} onValueChange={setTeacherId} disabled={!subjectId}>
                <SelectTrigger className="h-8 rounded-md border-[#D4D4D4]">
                  <SelectValue placeholder={subjectId ? "Select teacher" : "Select subject first"} />
                </SelectTrigger>
                <SelectContent>
                  {teacherOptions.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {subjectId && allocatedTeacherIds.length === 0 && (
                <p className="text-[11px] text-amber-700">No allocation found for this subject</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              {savedSlot ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 rounded-md text-[#525252] hover:bg-[#F5F5F5]"
                  onClick={handleClear}
                  disabled={isPending}
                >
                  Clear slot
                </Button>
              ) : <span />}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-8 rounded-md border-[#E5E5E5] bg-[#F5F5F5] text-[#171717]"
                  onClick={() => onOpenChange?.(null)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="h-8 rounded-md bg-[#ba2032] text-white hover:bg-[#ba2032]"
                  onClick={handleSave}
                  disabled={isPending || !subjectId || !teacherId}
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save slot"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
