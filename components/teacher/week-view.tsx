"use client";

import { useState, useEffect } from "react";
import { PERIOD_TIMES, formatTimeLabel } from "@/lib/timetable-constants";
import { PeriodCard } from "@/components/teacher/period-card";

interface WeekViewProps {
  weekStart: Date;
  periodInstances: any[];
  timetableSlots: any[];
  chapters: any[];
  chapterPeriods: any[];
  subjects: any[];
  standards: any[];
  divisions: any[];
  holidays: any[];
  isTeacher: boolean;
  canLog: boolean;
  loggedBy: string;
  periodOverrides?: any[];
  role?: string;
  teachers?: any[];
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function WeekView({
  weekStart,
  periodInstances,
  timetableSlots,
  chapters,
  chapterPeriods,
  subjects,
  standards,
  divisions,
  holidays,
  isTeacher,
  canLog,
  loggedBy,
  periodOverrides = [],
  role = "teacher",
  teachers = [],
}: WeekViewProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  useEffect(() => {
    if (selectedDayIndex === null) {
      const today = new Date().toISOString().split("T")[0];
      const todayIndex = DAYS.findIndex((_, idx) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + idx);
        return date.toISOString().split("T")[0] === today;
      });
      setSelectedDayIndex(todayIndex >= 0 ? todayIndex : 0);
    }
  }, [weekStart, selectedDayIndex]);

  const createLookup = (arr: any[], key: string) => {
    const map = new Map();
    arr.forEach((item) => map.set(item.id, item));
    return map;
  };

  const chapterMap = createLookup(chapters, "id");
  const chapterPeriodMap = createLookup(chapterPeriods, "id");
  const subjectMap = createLookup(subjects, "id");
  const standardMap = createLookup(standards, "id");
  const divisionMap = createLookup(divisions, "id");

  const periodsByDate = new Map<string, any[]>();
  periodInstances.forEach((instance) => {
    if (!periodsByDate.has(instance.date)) {
      periodsByDate.set(instance.date, []);
    }
    periodsByDate.get(instance.date)!.push(instance);
  });

  periodsByDate.forEach((periods) => {
    periods.sort(
      (a, b) =>
        (timetableSlots.find((s) => s.id === a.timetable_slot_id)?.period_number || 0) -
        (timetableSlots.find((s) => s.id === b.timetable_slot_id)?.period_number || 0)
    );
  });

  const hasAnyPeriods = periodInstances.length > 0;

  if (!hasAnyPeriods) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <div>
          <p className="text-base font-medium text-foreground">
            No schedule generated yet for this week.
          </p>
          <p className="text-sm text-muted-foreground">
            Ask admin to generate the timetable.
          </p>
        </div>
      </div>
    );
  }

  const isLivePeriod = (instance: any): boolean => {
    const now = new Date();
    const todayIso = now.toISOString().split("T")[0];
    if (instance.date !== todayIso) return false;

    const slot = timetableSlots.find((s) => s.id === instance.timetable_slot_id);
    if (!slot) return false;

    const periodTime = PERIOD_TIMES.find((p) => p.period === slot.period_number);
    if (!periodTime) return false;

    const [startH, startM] = periodTime.start.split(":").map(Number);
    const [endH, endM] = periodTime.end.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  };

  const renderDayContent = (dayIndex: number) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayIndex);
    const dateIso = date.toISOString().split("T")[0];
    const dayPeriods = periodsByDate.get(dateIso) || [];
    const today = new Date().toISOString().split("T")[0];
    const isToday = dateIso === today;
    const dayNum = date.getDate();
    const holiday = holidays.find((h: any) => h.date === dateIso);
    const allPeriodsCancelled = dayPeriods.length > 0 && dayPeriods.every(p => p.status === "cancelled");
    const isHoliday = allPeriodsCancelled || !!holiday;

    return (
      <div key={dayIndex} className="flex flex-col">
        <div
          className={`md:hidden text-center py-2 mb-3 rounded-lg transition ${
            isToday ? "bg-[#ba2032] text-white" : "bg-muted text-muted-foreground"
          }`}
        >
          <div className="text-xs font-semibold uppercase">{DAYS[dayIndex]}</div>
          <div className="text-lg font-bold">{dayNum}</div>
          {isHoliday && (
            <div className="text-xs font-medium mt-1 text-red-600">
              {holiday?.name || "Holiday"}
            </div>
          )}
        </div>

        {dayPeriods.length === 0 ? (
          <div className="py-2 text-center">
            <p className="text-xs text-muted-foreground font-medium">No classes</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {dayPeriods.map((instance) => {
              const slot = timetableSlots.find((s) => s.id === instance.timetable_slot_id);
              const subject = slot ? subjectMap.get(slot.subject_id) : null;
              const division = slot ? divisionMap.get(slot.division_id) : null;
              const standard = division ? standardMap.get(division.standard_id) : null;
              const chapter = instance.chapter_id ? chapterMap.get(instance.chapter_id) : null;
              const chapterPeriod = chapter
                ? Array.from(chapterPeriodMap.values()).find(
                    (cp) =>
                      cp.chapter_id === chapter.id &&
                      cp.period_number === instance.chapter_period_sequence
                  )
                : null;

              const periodOverride = periodOverrides.find(
                (o) => o.timetable_slot_id === instance.timetable_slot_id && o.date === dateIso
              );

              const isLive = isLivePeriod(instance);

              return (
                <div
                  key={instance.id}
                  className={isLive ? "rounded-lg ring-2 ring-green-500 ring-offset-2" : ""}
                >
                  <PeriodCard
                    periodInstance={instance}
                    slot={slot}
                    chapter={chapter}
                    chapterPeriod={chapterPeriod}
                    subject={subject}
                    standard={standard}
                    division={division}
                    isTeacher={isTeacher}
                    canLog={canLog}
                    loggedBy={loggedBy}
                    periodOverride={periodOverride}
                    role={role}
                    teachers={teachers}
                    chapters={chapters}
                    isLive={isLive}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile day selector tabs */}
      <div className="md:hidden mb-3 flex gap-2 overflow-x-auto pb-2">
        {DAYS.map((dayLabel, dayIndex) => {
          const date = new Date(weekStart);
          date.setDate(date.getDate() + dayIndex);
          const dateIso = date.toISOString().split("T")[0];
          const today = new Date().toISOString().split("T")[0];
          const isToday = dateIso === today;
          const isSelected = selectedDayIndex === dayIndex;

          return (
            <button
              key={dayIndex}
              onClick={() => setSelectedDayIndex(dayIndex)}
              className={`shrink-0 px-3 py-2 rounded-full text-xs font-medium transition ${
                isSelected
                  ? "bg-[#ba2032] text-white"
                  : isToday
                  ? "border border-[#ba2032] text-[#ba2032]"
                  : "border border-muted-foreground text-muted-foreground hover:border-foreground"
              }`}
            >
              {dayLabel} {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Mobile single day view */}
      <div className="md:hidden">
        {selectedDayIndex !== null && renderDayContent(selectedDayIndex)}
      </div>

      {/* Desktop grid view - only show days with classes */}
      <div className="hidden md:grid gap-3" style={{ gridTemplateColumns: `repeat(${DAYS.length}, 1fr)` }}>
        {DAYS.map((dayLabel, dayIndex) => {
          const date = new Date(weekStart);
          date.setDate(date.getDate() + dayIndex);
          const dateIso = date.toISOString().split("T")[0];
          const dayPeriods = periodsByDate.get(dateIso) || [];
          const today = new Date().toISOString().split("T")[0];
          const isToday = dateIso === today;
          const dayNum = date.getDate();
          const holiday = holidays.find((h: any) => h.date === dateIso);
          const allPeriodsCancelled = dayPeriods.length > 0 && dayPeriods.every(p => p.status === "cancelled");
          const isHoliday = allPeriodsCancelled || !!holiday;
          const hasClasses = dayPeriods.length > 0;

          return (
            <div key={dayLabel} className="flex flex-col">
              <div
                className={`text-center py-2 mb-2 rounded-lg transition ${
                  isToday ? "bg-[#ba2032] text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                <div className="text-xs font-semibold uppercase">{dayLabel}</div>
                <div className="text-base font-bold">{dayNum}</div>
                {isHoliday && (
                  <div className="text-xs font-medium mt-1 text-red-600">
                    {holiday?.name || "Holiday"}
                  </div>
                )}
              </div>

              {hasClasses ? (
                <div className="flex flex-col gap-2">
                  {dayPeriods.map((instance) => {
                    const slot = timetableSlots.find((s) => s.id === instance.timetable_slot_id);
                    const subject = slot ? subjectMap.get(slot.subject_id) : null;
                    const division = slot ? divisionMap.get(slot.division_id) : null;
                    const standard = division ? standardMap.get(division.standard_id) : null;
                    const chapter = instance.chapter_id ? chapterMap.get(instance.chapter_id) : null;
                    const chapterPeriod = chapter
                      ? Array.from(chapterPeriodMap.values()).find(
                          (cp) =>
                            cp.chapter_id === chapter.id &&
                            cp.period_number === instance.chapter_period_sequence
                        )
                      : null;

                    const periodOverride = periodOverrides.find(
                      (o) => o.timetable_slot_id === instance.timetable_slot_id && o.date === dateIso
                    );

                    const isLive = isLivePeriod(instance);

                    return (
                      <div
                        key={instance.id}
                        className={isLive ? "rounded-lg ring-2 ring-green-500 ring-offset-2" : ""}
                      >
                        <PeriodCard
                          periodInstance={instance}
                          slot={slot}
                          chapter={chapter}
                          chapterPeriod={chapterPeriod}
                          subject={subject}
                          standard={standard}
                          division={division}
                          isTeacher={isTeacher}
                          canLog={canLog}
                          loggedBy={loggedBy}
                          periodOverride={periodOverride}
                          role={role}
                          teachers={teachers}
                          chapters={chapters}
                          isLive={isLive}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-2 text-center">
                  <p className="text-xs text-muted-foreground font-medium">No classes</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
