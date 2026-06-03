"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WeekView } from "@/components/teacher/week-view";
import { AbsencePanel } from "@/components/teacher/absence-panel";
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
}

interface TeacherShellProps {
  role: UserRole;
  currentTeacherId: string;
  currentUserProfile: any;
  weekStart: Date;
  data: TeacherData;
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
  const [showAbsences, setShowAbsences] = useState(false);

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
  weekEnd.setDate(weekEnd.getDate() + 4);

  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const selectedTeacher = data.teachers.find((t) => t.id === currentTeacherId);

  return (
    <div className="flex flex-col md:flex-row flex-1 gap-6 h-full">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar - Mobile: Stack vertically, Desktop: Horizontal */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-6">
          {/* Left: Week navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleWeekChange(prevWeek)}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
            <div className="text-sm font-medium text-center flex-1 md:flex-none md:min-w-56">
              {weekLabel}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleWeekChange(nextWeek)}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Controls row - Mobile: Second row, Desktop: Same row */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Today button */}
            <Button variant="outline" size="sm" onClick={handleToday} disabled={isPending} className="flex-1 md:flex-none">
              {isPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                </>
              ) : null}
              Today
            </Button>

            {/* Absences tab button (mobile only) */}
            {role === "admin" && (
              <Button
                variant={showAbsences ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAbsences(!showAbsences)}
                className="md:hidden flex-1"
              >
                Absences
              </Button>
            )}

            {/* Teacher selector (admin/coordinator only) - Desktop only */}
            {role !== "teacher" && (
              <div className="hidden md:block">
                <Select value={currentTeacherId} onValueChange={handleTeacherChange}>
                  <SelectTrigger className="w-56">
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
              </div>
            )}
          </div>

          {/* Teacher selector (admin/coordinator only) - Mobile: Below other controls */}
          {role !== "teacher" && (
            <div className="md:hidden">
              <Select value={currentTeacherId} onValueChange={handleTeacherChange}>
                <SelectTrigger className="w-full">
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
            </div>
          )}
        </div>

        {/* Week view or Absences - Mobile toggle, Desktop: Week view only */}
        {!showAbsences ? (
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
          />
        ) : (
          role === "admin" && selectedTeacher && (
            <div className="md:hidden overflow-y-auto">
              <AbsencePanel
                selectedTeacherId={currentTeacherId}
                selectedTeacherName={selectedTeacher.name}
                allTeachers={data.teachers}
                absences={data.absences}
                loggedBy={currentUserProfile.id}
              />
            </div>
          )
        )}
      </div>

      {/* Right sidebar: Absence panel (admin only, desktop only) */}
      {role === "admin" && selectedTeacher && (
        <div className="hidden md:block w-80 shrink-0">
          <AbsencePanel
            selectedTeacherId={currentTeacherId}
            selectedTeacherName={selectedTeacher.name}
            allTeachers={data.teachers}
            absences={data.absences}
            loggedBy={currentUserProfile.id}
          />
        </div>
      )}
    </div>
  );
}
