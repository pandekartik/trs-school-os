"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AcademicSegment,
  Chapter,
  Holiday,
  Standard,
  Subject,
  Teacher,
  TeacherAssignment,
  TimetableSlot,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { SlotGrid } from "@/components/timetable/slot-grid";
import { HolidayManager } from "@/components/timetable/holiday-manager";
import { ScheduleGenerator } from "@/components/timetable/schedule-generator";

type SchoolYear = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

type Division = {
  id: string;
  standard_id: string;
  name: string;
};

type TimetableShellProps = {
  schoolYears: SchoolYear[];
  standards: Standard[];
  divisions: Division[];
  subjects: Subject[];
  teachers: Teacher[];
  teacherAssignments: TeacherAssignment[];
  timetableSlots: TimetableSlot[];
  holidays: Holiday[];
  segments: AcademicSegment[];
  chapters: Chapter[];
};

export function TimetableShell({
  schoolYears,
  standards,
  divisions,
  subjects,
  teachers,
  teacherAssignments,
  timetableSlots,
  holidays,
  segments,
  chapters,
}: TimetableShellProps) {
  const activeSchoolYear = schoolYears.find((year) => year.is_active) ?? schoolYears[0] ?? null;
  const [selectedStandardId, setSelectedStandardId] = useState<string | null>(null);
  const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(null);
  const didInitStandard = useRef(false);

  const selectedStandard = useMemo(
    () => standards.find((standard) => standard.id === selectedStandardId) ?? null,
    [selectedStandardId, standards]
  );
  const selectedDivision = useMemo(
    () => divisions.find((division) => division.id === selectedDivisionId) ?? null,
    [divisions, selectedDivisionId]
  );

  const divisionsForStandard = useMemo(
    () => divisions
      .filter((division) => !selectedStandardId || division.standard_id === selectedStandardId)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [divisions, selectedStandardId]
  );

  const subjectsForStandard = useMemo(
    () => subjects
      .filter((subject) => !selectedStandardId || subject.standard_id === selectedStandardId)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [selectedStandardId, subjects]
  );

  const slotsForDivision = useMemo(
    () => timetableSlots.filter((slot) => slot.division_id === selectedDivisionId),
    [selectedDivisionId, timetableSlots]
  );

  const holidaysForActiveYear = useMemo(
    () => holidays.filter((holiday) => !activeSchoolYear || holiday.school_year_id === activeSchoolYear.id),
    [activeSchoolYear, holidays]
  );

  const segmentsForStandard = useMemo(
    () => segments
      .filter((segment) => !selectedStandardId || segment.standard_id === selectedStandardId)
      .filter((segment) => !activeSchoolYear || segment.school_year_id === activeSchoolYear.id)
      .sort((a, b) => a.sequence_number - b.sequence_number),
    [activeSchoolYear, selectedStandardId, segments]
  );

  const chaptersForDivision = useMemo(
    () => chapters
      .filter((chapter) => selectedStandardId
        ? subjects.find((subject) => subject.id === chapter.subject_id)?.standard_id === selectedStandardId
        : true)
      .sort((a, b) => a.display_order - b.display_order || a.chapter_number - b.chapter_number),
    [chapters, selectedStandardId, subjects]
  );

  useEffect(() => {
    if (didInitStandard.current) return;
    if (standards.length === 0) return;
    didInitStandard.current = true;
    setSelectedStandardId(standards[0].id);
  }, [standards]);

  useEffect(() => {
    if (!selectedStandardId) return;
    if (selectedDivision && selectedDivision.standard_id === selectedStandardId) return;
    const nextDivision = divisionsForStandard[0] ?? null;
    setSelectedDivisionId(nextDivision?.id ?? null);
  }, [divisionsForStandard, selectedDivision, selectedStandardId]);

  const [activeTab, setActiveTab] = useState("timetable");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <Card className="sticky top-0 z-10 overflow-hidden border bg-card/95 shadow-sm backdrop-blur">
        <CardHeader className="border-b px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">Timetable</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Build weekly slots, mark holidays, and generate the schedule
                </p>
              </div>
              {activeSchoolYear ? (
                <Badge variant="outline" className="font-normal">
                  {activeSchoolYear.name}
                </Badge>
              ) : (
                <Badge variant="outline" className="font-normal">
                  No active school year
                </Badge>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStandardId(null);
                    setSelectedDivisionId(null);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    selectedStandardId === null
                      ? "border-[#ba2032] bg-[#ba2032] text-white"
                      : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  All standards
                </button>
                {standards.map((standard) => {
                  const selected = selectedStandardId === standard.id;
                  return (
                    <button
                      key={standard.id}
                      type="button"
                      onClick={() => setSelectedStandardId(standard.id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        selected
                          ? "border-[#ba2032] bg-[#ba2032] text-white"
                          : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      )}
                    >
                      {standard.name}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedStandardId ? (
                  divisionsForStandard.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No divisions for this standard</span>
                  ) : divisionsForStandard.map((division) => {
                    const selected = selectedDivisionId === division.id;
                    return (
                      <button
                        key={division.id}
                        type="button"
                        onClick={() => setSelectedDivisionId(division.id)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          selected
                            ? "border-[#ba2032] bg-[#ba2032] text-white"
                            : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        )}
                      >
                        Div {division.name}
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-muted-foreground">Select a standard to see divisions</span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="w-fit">
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
          <TabsTrigger value="generate">Generate Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="timetable" className="mt-4 min-h-0 flex-1">
          {selectedDivision && activeSchoolYear ? (
            <SlotGrid
              division={selectedDivision}
              schoolYearId={activeSchoolYear.id}
              standard={selectedStandard}
              subjects={subjectsForStandard}
              teachers={teachers}
              teacherAssignments={teacherAssignments}
              slots={slotsForDivision}
            />
          ) : (
            <Card className="flex min-h-[640px] items-center justify-center">
              <div className="text-center">
                <p className="text-sm font-medium">Select a standard and division to view the timetable</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Timetable slots are configured per division.
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="holidays" className="mt-4 min-h-0 flex-1">
          <HolidayManager
            schoolYearId={activeSchoolYear?.id ?? ""}
            divisions={divisionsForStandard}
            holidays={holidaysForActiveYear}
            selectedStandardName={selectedStandard?.name ?? null}
          />
        </TabsContent>

        <TabsContent value="generate" className="mt-4 min-h-0 flex-1">
          <ScheduleGenerator
            division={selectedDivision}
            schoolYear={activeSchoolYear}
            standard={selectedStandard}
            segments={segmentsForStandard}
            chapters={chaptersForDivision}
            slots={slotsForDivision}
            onGenerateSuccess={() => setActiveTab("timetable")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
