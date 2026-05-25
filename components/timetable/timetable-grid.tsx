"use client";

import { Pencil, Plus } from "lucide-react";
import type {
  Division,
  Subject,
  Teacher,
  TeacherAssignment,
  TemplateSlot,
  TimeTemplate,
  TimetableSlot,
} from "@/lib/types";
import { SlotPopover } from "@/components/timetable/slot-popover";

type TimetableGridProps = {
  division: Division;
  template: TimeTemplate;
  templateSlots: TemplateSlot[];
  existingSlots: TimetableSlot[];
  subjects: Subject[];
  teachers: Teacher[];
  teacherAssignments: TeacherAssignment[];
};

const COLORS = ["#3B82F6", "#16A34A", "#D97706", "#8B5CF6", "#EC4899", "#0891B2"];
const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

function isClassSlot(slot: TemplateSlot) {
  return slot.slot_type === "period" || slot.slot_type === "class";
}

function colorFor(id: string) {
  const hash = id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
}

export function TimetableGrid({
  division,
  template,
  templateSlots,
  existingSlots,
  subjects,
  teachers,
  teacherAssignments,
}: TimetableGridProps) {
  const days = template.days;

  return (
    <div className="overflow-hidden rounded-lg border border-[#E5E5E5] bg-white">
      <div
        className="grid"
        style={{ gridTemplateColumns: `100px repeat(${days.length}, minmax(120px, 1fr))` }}
      >
        <div className="border-b border-r border-[#E5E5E5] bg-[#FAFAFA]" />
        {days.map((day) => (
          <div
            key={day}
            className="flex h-9 items-center justify-center border-b border-[#E5E5E5] bg-[#FAFAFA] text-[11px] font-medium uppercase text-[#A3A3A3]"
          >
            {DAY_LABELS[day.toLowerCase()] ?? day}
          </div>
        ))}

        {templateSlots.map((slot) => {
          const classSlot = isClassSlot(slot);
          return (
            <div key={slot.id} className="contents">
              <div
                className={[
                  "min-h-[72px] border-r border-[#E5E5E5] bg-[#FAFAFA] px-3 py-3 text-xs",
                  classSlot ? "text-[#171717]" : "text-[#737373] italic",
                ].join(" ")}
              >
                <div className="font-medium">{slot.name}</div>
                <div className="mt-1 text-[11px] text-[#737373]">{slot.start_time}–{slot.end_time}</div>
              </div>
              {!classSlot ? (
                <div
                  className="flex min-h-[72px] items-center justify-center bg-[#F5F5F5] text-sm italic text-[#737373]"
                  style={{ gridColumn: `span ${days.length}` }}
                >
                  {slot.name}
                </div>
              ) : (
                days.map((day) => {
                  const saved = existingSlots.find(
                    (existing) => existing.template_slot_id === slot.id && existing.day_of_week === day
                  );
                  const subject = subjects.find((item) => item.id === saved?.subject_id) ?? null;
                  const teacher = teachers.find((item) => item.id === saved?.teacher_id) ?? null;

                  return (
                    <SlotPopover
                      key={`${slot.id}-${day}`}
                      division={division}
                      day={day}
                      slot={slot}
                      savedSlot={saved ?? null}
                      subjects={subjects}
                      teachers={teachers}
                      teacherAssignments={teacherAssignments}
                    >
                      <button
                        type="button"
                        className={[
                          "group relative m-2 min-h-[56px] rounded-md border p-3 text-left transition-colors",
                          saved
                            ? "border-[#E5E5E5] bg-white hover:bg-[#FAFAFA]"
                            : "border-dashed border-[#D4D4D4] bg-white text-[#737373] hover:border-[#A3A3A3] hover:bg-[#FAFAFA]",
                        ].join(" ")}
                      >
                        {saved && subject ? (
                          <>
                            <Pencil className="absolute right-2 top-2 hidden h-3.5 w-3.5 text-[#A3A3A3] group-hover:block" />
                            <div className="flex items-center gap-2 pr-4">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ background: colorFor(subject.id) }} />
                              <span className="truncate text-[13px] font-medium text-[#171717]">{subject.name}</span>
                            </div>
                            <div className="mt-1 truncate text-xs text-[#737373]">{teacher?.name ?? "Teacher"}</div>
                          </>
                        ) : (
                          <div className="flex min-h-[30px] items-center justify-center gap-1 text-xs">
                            <Plus className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </button>
                    </SlotPopover>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
