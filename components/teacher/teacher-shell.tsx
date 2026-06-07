"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WeekView } from "@/components/teacher/week-view";
import { TodaySummary } from "@/components/teacher/today-summary";
import { AbsenceDrawer } from "@/components/teacher/absence-drawer";
import type { UserRole } from "@/lib/role-access";

interface Teacher {
  id: string;
  name: string;
}

interface TeacherData {
  periodInstances: any[];
  timetableSlots: any[];
  chapters: any[];
  chapterPeriods: any[];
  subjects: any[];
  standards: any[];
  divisions: any[];
  teachers: any[];
  absences: any[];
  holidays: any[];
  academicSegments: any[];
  divisionTemplates: any[];
  timetableActivations: any[];
  periodOverrides: any[];
}

interface TeacherShellProps {
  role: UserRole;
  currentTeacherId: string;
  currentUserProfile: any;
  weekStart: Date;
  data: TeacherData;
  periodOverrides?: any[];
}

export function TeacherShell({
  role,
  currentTeacherId,
  currentUserProfile,
  weekStart,
  data,
}: TeacherShellProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAbsenceDrawerOpen, setIsAbsenceDrawerOpen] = useState(false);

  const handleWeekChange = (newWeekStart: Date) => {
    startTransition(() => {
      const isoDate = newWeekStart.toISOString().split("T")[0];
      const params = new URLSearchParams();
      params.set("week", isoDate);
      if (role !== "teacher" && currentTeacherId !== data.teachers[0]?.id) {
        params.set("teacher", currentTeacherId);
      }
      router.push(`/teacher?${params.toString()}`);
    });
  };

  const handleTeacherChange = (teacherId: string) => {
    const params = new URLSearchParams();
    params.set("teacher", teacherId);
    const isoDate = weekStart.toISOString().split("T")[0];
    params.set("week", isoDate);
    router.push(`/teacher?${params.toString()}`);
  };

  const handleToday = () => {
    const today = new Date();
    handleWeekChange(today);
  };

  const prevWeek = new Date(weekStart);
  prevWeek.setDate(prevWeek.getDate() - 7);

  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 5);

  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const selectedTeacher = data.teachers.find((t) => t.id === currentTeacherId);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))] sticky top-0 z-40">
        <div className="px-6 py-4 space-y-3">
          {/* Top row: Title + Actions */}
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Teacher View</h1>
            {role === "admin" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAbsenceDrawerOpen(true)}
              >
                Mark Absence
              </Button>
            )}
          </div>

          {/* Navigation row: Left (prev) + Center (nav) + Right (selectors) */}
          <div className="flex items-center justify-between gap-4">
            {/* Left: Previous Week */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleWeekChange(prevWeek)}
              disabled={isPending}
              className="px-2"
            >
              ← Prev
            </Button>

            {/* Center: Week label + Today + Next */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium whitespace-nowrap px-3 py-1 rounded bg-muted">
                {weekLabel}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                disabled={isPending}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleWeekChange(nextWeek)}
                disabled={isPending}
                className="px-2"
              >
                Next →
              </Button>
            </div>

            {/* Right: Teacher selector */}
            {role !== "teacher" && (
              <Select value={currentTeacherId} onValueChange={handleTeacherChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {data.teachers.map((teacher: Teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Today Summary */}
      <TodaySummary
        weekStart={weekStart}
        periodInstances={data.periodInstances}
        timetableSlots={data.timetableSlots}
        subjects={data.subjects}
        divisions={data.divisions}
        standards={data.standards}
      />

      {/* Schedule Grid - Main content */}
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-4">
          <WeekView
            weekStart={weekStart}
            periodInstances={data.periodInstances}
            timetableSlots={data.timetableSlots}
            chapters={data.chapters}
            chapterPeriods={data.chapterPeriods}
            subjects={data.subjects}
            standards={data.standards}
            divisions={data.divisions}
            holidays={data.holidays}
            isTeacher={role === "teacher"}
            canLog={role === "admin" || role === "teacher"}
            loggedBy={currentUserProfile.id}
            periodOverrides={data.periodOverrides}
            role={role}
            teachers={data.teachers}
          />
        </div>
      </div>

      {/* Absence Drawer */}
      {role === "admin" && selectedTeacher && (
        <AbsenceDrawer
          open={isAbsenceDrawerOpen}
          onOpenChange={setIsAbsenceDrawerOpen}
          selectedTeacherId={currentTeacherId}
          selectedTeacherName={selectedTeacher.name}
          allTeachers={data.teachers}
          absences={data.absences}
          loggedBy={currentUserProfile.id}
        />
      )}
    </div>
  );
}
