"use client";

import { PERIOD_TIMES, formatTimeLabel } from "@/lib/timetable-constants";

interface TodaySummaryProps {
  weekStart: Date;
  periodInstances: any[];
  timetableSlots: any[];
  subjects: any[];
  divisions: any[];
  standards: any[];
}

export function TodaySummary({
  weekStart,
  periodInstances,
  timetableSlots,
  subjects,
  divisions,
  standards,
}: TodaySummaryProps) {
  const today = new Date();
  const todayIso = today.toISOString().split("T")[0];
  const todayPeriods = periodInstances.filter((p) => p.date === todayIso);

  const totalPeriods = todayPeriods.length;
  const completedPeriods = todayPeriods.filter((p) =>
    ["done", "partial", "not_done"].includes(p.status)
  ).length;

  // Find current and next periods
  let currentPeriod = null;
  let nextPeriod = null;
  const now = new Date();
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

  for (const period of todayPeriods) {
    const slot = timetableSlots.find((s) => s.id === period.timetable_slot_id);
    if (!slot) continue;

    const periodTime = PERIOD_TIMES.find((p) => p.period === slot.period_number);
    if (!periodTime) continue;

    const [startH, startM] = periodTime.start.split(":").map(Number);
    const [endH, endM] = periodTime.end.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes && !currentPeriod) {
      currentPeriod = { ...period, slot, subject: subjects.find((s) => s.id === slot.subject_id) };
    } else if (currentTimeMinutes < startMinutes && !nextPeriod) {
      nextPeriod = { ...period, slot, subject: subjects.find((s) => s.id === slot.subject_id) };
    }
  }

  const freePeriods = totalPeriods - completedPeriods;

  return (
    <div className="border-b bg-muted/30 px-4 py-3">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
        {/* Total Periods */}
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium">Total</span>
          <span className="text-lg font-semibold">{totalPeriods}</span>
        </div>

        {/* Completed */}
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium">Completed</span>
          <span className="text-lg font-semibold text-green-600">{completedPeriods}</span>
        </div>

        {/* Current Class */}
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium">Now</span>
          <span className="text-sm font-medium truncate">
            {currentPeriod ? currentPeriod.subject?.name : "—"}
          </span>
        </div>

        {/* Next Class */}
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium">Next</span>
          <span className="text-sm font-medium truncate">
            {nextPeriod ? nextPeriod.subject?.name : "—"}
          </span>
        </div>

        {/* Free Periods */}
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium">Free</span>
          <span className="text-lg font-semibold">{freePeriods}</span>
        </div>
      </div>
    </div>
  );
}
