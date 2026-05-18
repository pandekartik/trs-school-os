"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  Standard,
  Subject,
  Teacher,
  TeacherAssignment,
  TimetableSlot,
} from "@/lib/types";
import { createTimetableSlot, deleteTimetableSlot } from "@/lib/actions/timetable";
import { useAction } from "@/lib/hooks/use-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";
import { PERIOD_TIMES, TIMETABLE_DAYS, type TimetableDay, formatTimeLabel, getTodayIsoDate } from "@/lib/timetable-constants";

type Division = {
  id: string;
  standard_id: string;
  name: string;
};

type SlotGridProps = {
  division: Division;
  schoolYearId: string;
  standard: Standard | null;
  subjects: Subject[];
  teachers: Teacher[];
  teacherAssignments: TeacherAssignment[];
  slots: TimetableSlot[];
};

type EditorState = {
  day: TimetableDay;
  period: number;
} | null;

const subjectColors = [
  "#ba2032",
  "#185FA5",
  "#2F855A",
  "#7C3AED",
  "#B45309",
  "#0F766E",
];

function hashColor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % subjectColors.length;
  return subjectColors[hash];
}

export function SlotGrid({
  division,
  schoolYearId,
  standard,
  subjects,
  teachers,
  teacherAssignments,
  slots,
}: SlotGridProps) {
  const router = useRouter();
  const [editor, setEditor] = useState<EditorState>(null);
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");

  const saveAction = useAction(createTimetableSlot, {
    successMessage: "Timetable slot saved",
    onSuccess: () => {
      setEditor(null);
      router.refresh();
    },
  });

  const currentSlot = editor
    ? slots.find((slot) => slot.day_of_week === editor.day && slot.period_number === editor.period) ?? null
    : null;

  const subjectOptions = useMemo(
    () => subjects
      .filter((subject) => subject.standard_id === division.standard_id)
      .filter((subject) => subject.has_chapters || subject.type === "non_academic")
      .sort((a, b) => a.name.localeCompare(b.name)),
    [division.standard_id, subjects]
  );

  const subjectById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject])),
    [subjects]
  );
  const teacherById = useMemo(
    () => new Map(teachers.map((teacher) => [teacher.id, teacher])),
    [teachers]
  );

  const teacherOptions = useMemo(() => {
    if (!subjectId) {
      return teachers.filter((teacher) => teacher.is_active).sort((a, b) => a.name.localeCompare(b.name));
    }

    const assignedTeacherIds = new Set(
      teacherAssignments
        .filter((assignment) => assignment.division_id === division.id)
        .filter((assignment) => assignment.subject_id === subjectId)
        .filter((assignment) => assignment.school_year_id === schoolYearId)
        .map((assignment) => assignment.teacher_id)
    );

    const assigned = teachers
      .filter((teacher) => teacher.is_active && assignedTeacherIds.has(teacher.id))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (assigned.length > 0) return assigned;

    return teachers.filter((teacher) => teacher.is_active).sort((a, b) => a.name.localeCompare(b.name));
  }, [division.id, schoolYearId, subjectId, teacherAssignments, teachers]);

  useEffect(() => {
    if (!editor) return;

    if (currentSlot) {
      setSubjectId(currentSlot.subject_id);
      setTeacherId(currentSlot.teacher_id);
      return;
    }

    setSubjectId(subjectOptions[0]?.id ?? "");
  }, [currentSlot, editor, subjectOptions]);

  useEffect(() => {
    if (!subjectId) return;
    if (teacherOptions.some((teacher) => teacher.id === teacherId)) return;
    setTeacherId(teacherOptions[0]?.id ?? "");
  }, [subjectId, teacherId, teacherOptions]);

  function openEditor(day: TimetableDay, period: number) {
    setEditor({ day, period });
  }

  async function handleClear() {
    if (!currentSlot) return;
    const result = await deleteTimetableSlot(currentSlot.id);
    if (result?.error) {
      toast.error("Clear failed", { description: result.error });
      return;
    }

    toast.success("Slot cleared");
    setEditor(null);
    router.refresh();
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Weekly Timetable</h2>
            <p className="text-sm text-muted-foreground">
              {standard ? `${standard.name} · ` : ""}
              Div {division.name}
            </p>
          </div>
          <Badge variant="outline" className="font-normal">
            Effective slots only
          </Badge>
        </div>
      </div>

      <div className="overflow-x-auto p-4">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-[88px_repeat(5,minmax(0,1fr))] gap-2 pb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            <div />
            {TIMETABLE_DAYS.map((day) => (
              <div key={day} className="text-center">
                {day}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {PERIOD_TIMES.map((periodTime) => {
              const periodSlots = TIMETABLE_DAYS.map((day) =>
                slots.find((slot) => slot.day_of_week === day && slot.period_number === periodTime.period) ?? null
              );

              return (
                <div key={periodTime.period} className="grid grid-cols-[88px_repeat(5,minmax(0,1fr))] gap-2">
                  <div className="rounded-xl border bg-secondary/20 px-3 py-3 text-left">
                    <div className="text-xs font-semibold">Period {periodTime.period}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {formatTimeLabel(periodTime.start)} - {formatTimeLabel(periodTime.end)}
                    </div>
                  </div>

                  {periodSlots.map((slot, index) => {
                    const day = TIMETABLE_DAYS[index];
                    const color = slot ? hashColor(slot.subject_id) : "#d1d5db";
                    const isEmpty = !slot;

                    return (
                      <button
                        key={`${day}-${periodTime.period}`}
                        type="button"
                        onClick={() => openEditor(day, periodTime.period)}
                        className={cn(
                          "group min-h-[92px] rounded-xl border p-3 text-left transition-colors",
                          isEmpty
                            ? "border-dashed border-border bg-card hover:border-[#ba2032] hover:bg-[#fce8ea]/40"
                            : "border-border bg-card hover:bg-secondary/30"
                        )}
                      >
                        {slot ? (
                          <div className="flex h-full flex-col justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span
                              className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <div className="min-w-0">
                              <div className="truncate text-xs font-semibold">
                                  {subjectById.get(slot.subject_id)?.name ?? "Unknown subject"}
                              </div>
                              <div className="truncate text-[11px] text-muted-foreground">
                                  {teacherById.get(slot.teacher_id)?.name ?? "Unknown teacher"}
                              </div>
                            </div>
                          </div>
                            <div className="text-[10px] text-muted-foreground">
                              {slot.start_time} - {slot.end_time}
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-full min-h-[68px] items-center justify-center text-muted-foreground">
                            <Plus className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                        )}
                      </button>
                    );
                  })}

                  {periodTime.period === 4 && (
                    <div className="col-span-6 rounded-xl border border-dashed bg-secondary/20 px-4 py-2 text-center text-xs font-medium tracking-wider text-muted-foreground">
                      RECESS · 10:35 AM - 11:05 AM
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={Boolean(editor)} onOpenChange={(open) => !open && setEditor(null)}>
          <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Assign timetable slot</DialogTitle>
            <DialogDescription>
              Choose a subject and teacher for the selected day and period.
            </DialogDescription>
          </DialogHeader>

          {editor && (
            <form onSubmit={saveAction.handleSubmit} className="flex flex-col gap-4">
              <input type="hidden" name="school_year_id" value={schoolYearId} />
              <input type="hidden" name="division_id" value={division.id} />
              <input type="hidden" name="day_of_week" value={editor.day} />
              <input type="hidden" name="period_number" value={String(editor.period)} />
              <input type="hidden" name="effective_from" value={getTodayIsoDate()} />
              <input type="hidden" name="subject_id" value={subjectId} />
              <input type="hidden" name="teacher_id" value={teacherId} />

              <div className="grid gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="text-xs font-medium">Subject</div>
                  <Select value={subjectId} onValueChange={setSubjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectOptions.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                          <div className="text-xs font-medium">Teacher</div>
                  <Select value={teacherId} onValueChange={setTeacherId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teacherOptions.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    {teacherAssignments.some(
                      (assignment) =>
                        assignment.division_id === division.id &&
                        assignment.subject_id === subjectId &&
                        assignment.school_year_id === schoolYearId
                    )
                      ? "Showing assigned teachers"
                      : "No assignment found, showing all active teachers"}
                  </p>
                </div>
              </div>

              <DialogFooter className="px-0 pb-0 pt-2">
                {currentSlot && (
                  <Button type="button" variant="outline" onClick={handleClear}>
                    Clear slot
                  </Button>
                )}
                <Button type="submit" disabled={saveAction.loading || !subjectId || !teacherId}>
                  {saveAction.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save slot"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
