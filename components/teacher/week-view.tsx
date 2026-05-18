"use client";

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
  isTeacher: boolean;
  canLog: boolean;
  loggedBy: string;
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];

export function WeekView({
  weekStart,
  periodInstances,
  timetableSlots,
  chapters,
  chapterPeriods,
  subjects,
  standards,
  divisions,
  isTeacher,
  canLog,
  loggedBy,
}: WeekViewProps) {
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

  // Group period instances by date
  const periodsByDate = new Map<string, any[]>();
  periodInstances.forEach((instance) => {
    if (!periodsByDate.has(instance.date)) {
      periodsByDate.set(instance.date, []);
    }
    periodsByDate.get(instance.date)!.push(instance);
  });

  // Sort periods within each day by period number
  periodsByDate.forEach((periods) => {
    periods.sort(
      (a, b) =>
        (timetableSlots.find((s) => s.id === a.timetable_slot_id)?.period_number || 0) -
        (timetableSlots.find((s) => s.id === b.timetable_slot_id)?.period_number || 0)
    );
  });

  // Check if there are any periods this week
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

  return (
    <div className="grid grid-cols-5 gap-4">
      {DAYS.map((dayLabel, dayIndex) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + dayIndex);
        const dateIso = date.toISOString().split("T")[0];

        const dayPeriods = periodsByDate.get(dateIso) || [];
        const today = new Date().toISOString().split("T")[0];
        const isToday = dateIso === today;

        const dayNum = date.getDate();

        const allPeriodsCancelled = dayPeriods.length > 0 && dayPeriods.every(p => p.status === "cancelled");
        const isHoliday = allPeriodsCancelled;

        return (
          <div key={dayLabel} className="flex flex-col">
            {/* Date header */}
            <div
              className={`text-center py-3 mb-4 rounded-lg transition ${
                isToday ? "bg-[#ba2032] text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              <div className="text-xs font-semibold uppercase">{dayLabel}</div>
              <div className="text-lg font-bold">{dayNum}</div>
              {isHoliday && <div className="text-xs font-medium mt-1">Holiday</div>}
            </div>

            {/* Period cards */}
            {dayPeriods.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-center">
                <p className="text-xs text-muted-foreground">No periods</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
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

                  return (
                    <PeriodCard
                      key={instance.id}
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
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
