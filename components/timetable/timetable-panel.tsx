"use client";

import { useState } from "react";
import type {
  Timetable,
  Branch,
  Standard,
  Division,
  Subject,
  Teacher,
  TeacherAssignment,
  TimeTemplate,
  TimetableSlot,
  SchoolYear,
  AcademicSegment,
  Chapter,
} from "@/lib/types";
import {
  createTimetable,
  updateTimetable,
  assignDivisionsToTimetable,
  saveDayTemplate,
  removeDayTemplate,
  saveTimetableSlot,
  clearTimetableSlot,
} from "@/lib/actions/timetable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScheduleGenerator } from "./schedule-generator";
import { exportTimetableGridToPdf } from "@/lib/utils/timetable-pdf";
import { Download } from "lucide-react";

type Props = {
  timetable: (Timetable & { timetable_division?: Array<{ division_id: string }>; timetable_day_template?: Array<{ day_of_week: string; template_id: string }> }) | null;
  divisions: Division[];
  standards: Standard[];
  templates: Array<TimeTemplate & { template_slot?: Array<any> }>;
  subjects: Subject[];
  teachers: Teacher[];
  teacherAssignments: TeacherAssignment[];
  existingSlots: TimetableSlot[];
  branches: Branch[];
  onClose: () => void;
  panelView: "form" | "builder";
  schoolYears?: SchoolYear[];
  activeBranchId?: string | null;
  segments?: AcademicSegment[];
  chapters?: Chapter[];
};

export function TimetablePanel({
  timetable,
  divisions,
  standards,
  templates,
  subjects,
  teachers,
  teacherAssignments,
  existingSlots,
  branches,
  onClose,
  panelView,
  schoolYears = [],
  activeBranchId = null,
  segments = [],
  chapters = [],
}: Props) {
  const isNewTimetable = !timetable;
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "days" | "slots" | "generate">(
    panelView === "form" ? "details" : "slots"
  );

  // Details tab state
  const [name, setName] = useState(timetable?.name ?? "");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(
    timetable?.school_year_id ?? ""
  );
  const [selectedBranch, setSelectedBranch] = useState(
    timetable?.branch_id ?? activeBranchId ?? ""
  );
  const [selectedDivisions, setSelectedDivisions] = useState<Set<string>>(
    new Set(timetable?.timetable_division?.map((td) => td.division_id) ?? [])
  );

  // Days tab state
  const [dayTemplates, setDayTemplates] = useState<Record<string, string>>(
    (() => {
      const map: Record<string, string> = {};
      timetable?.timetable_day_template?.forEach((dt) => {
        map[dt.day_of_week] = dt.template_id;
      });
      return map;
    })()
  );

  // Slots tab state
  const [activeDivisionForGrid, setActiveDivisionForGrid] = useState<string | null>(null);

  const daysOfWeek = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const getDivisionsWithStandard = () => {
    return divisions
      .map((div) => {
        const standard = standards.find((s) => s.id === div.standard_id);
        return { ...div, standardName: standard?.name ?? "Unknown" };
      })
      .sort((a, b) =>
        a.standardName.localeCompare(b.standardName) || a.name.localeCompare(b.name)
      );
  };

  const toggleDivision = (divisionId: string) => {
    const newSet = new Set(selectedDivisions);
    if (newSet.has(divisionId)) {
      newSet.delete(divisionId);
    } else {
      newSet.add(divisionId);
    }
    setSelectedDivisions(newSet);
  };

  const handleSaveDetails = async () => {
    if (!name.trim()) {
      toast.error("Timetable name is required");
      return;
    }

    if (!selectedSchoolYear) {
      toast.error("School year is required");
      return;
    }

    if (selectedDivisions.size === 0) {
      toast.error("Select at least one division");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("school_year_id", selectedSchoolYear);
      if (selectedBranch) formData.append("branch_id", selectedBranch);

      let result;
      if (isNewTimetable) {
        result = await createTimetable(formData);
        if (result?.success && result?.id) {
          const assignResult = await assignDivisionsToTimetable(
            result.id,
            Array.from(selectedDivisions)
          );
          if (assignResult?.error) {
            toast.error(assignResult.error);
            return;
          }
          toast.success("Timetable created");
          onClose();
        }
      } else {
        result = await updateTimetable(timetable!.id, formData);
        if (result?.success) {
          const assignResult = await assignDivisionsToTimetable(
            timetable!.id,
            Array.from(selectedDivisions)
          );
          if (assignResult?.error) {
            toast.error(assignResult.error);
            return;
          }
          toast.success("Timetable updated");
          onClose();
        }
      }

      if (result?.error) {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error("Error saving timetable");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDayTemplate = async (dayOfWeek: string, templateId: string) => {
    if (!timetable) return;

    try {
      const dayLower = dayOfWeek.toLowerCase();
      if (templateId === "none") {
        const result = await removeDayTemplate(timetable.id, dayLower);
        if (result?.error) {
          toast.error(result.error);
        } else {
          setDayTemplates((prev) => {
            const newMap = { ...prev };
            delete newMap[dayOfWeek];
            return newMap;
          });
          toast.success("Template removed");
        }
      } else {
        const result = await saveDayTemplate(timetable.id, dayLower, templateId);
        if (result?.error) {
          toast.error(result.error);
        } else {
          setDayTemplates((prev) => ({
            ...prev,
            [dayOfWeek]: templateId,
          }));
          toast.success("Template saved");
        }
      }
    } catch (err) {
      toast.error("Error saving day template");
    }
  };

  const handleSaveSlot = async (
    divisionId: string,
    templateSlotId: string,
    dayOfWeek: string,
    subjectId: string,
    teacherId: string
  ) => {
    if (!timetable) return;

    try {
      const formData = new FormData();
      formData.append("timetable_id", timetable.id);
      formData.append("template_slot_id", templateSlotId);
      formData.append("subject_id", subjectId);
      formData.append("teacher_id", teacherId);
      formData.append("day_of_week", dayOfWeek);
      formData.append("division_id", divisionId);
      formData.append("school_year_id", timetable.school_year_id);
      if (timetable.branch_id) formData.append("branch_id", timetable.branch_id);

      const result = await saveTimetableSlot(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Slot saved");
      }
    } catch (err) {
      toast.error("Error saving slot");
    }
  };

  const handleClearSlot = async (
    divisionId: string,
    templateSlotId: string,
    dayOfWeek: string
  ) => {
    if (!timetable) return;

    try {
      const result = await clearTimetableSlot(
        timetable.id,
        templateSlotId,
        dayOfWeek,
        divisionId
      );
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Slot cleared");
      }
    } catch (err) {
      toast.error("Error clearing slot");
    }
  };

  const getSlotForCell = (
    divisionId: string,
    templateSlotId: string,
    dayOfWeek: string
  ) => {
    return existingSlots.find(
      (slot) =>
        slot.timetable_id === timetable?.id &&
        slot.division_id === divisionId &&
        slot.template_slot_id === templateSlotId &&
        slot.day_of_week === dayOfWeek
    );
  };

  const getTeachersForDivision = (divisionId: string, subjectId: string) => {
    return teacherAssignments
      .filter((a) => a.division_id === divisionId && a.subject_id === subjectId)
      .map((a) => teachers.find((t) => t.id === a.teacher_id))
      .filter(Boolean);
  };

  const getSelectedTemplate = (dayOfWeek: string) => {
    return dayTemplates[dayOfWeek] ?? "none";
  };

  const getTemplateSlots = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    return (template?.template_slot ?? [])
      .filter((slot: any) => slot.slot_type === "period" || slot.slot_type === "class")
      .sort((a: any, b: any) => a.display_order - b.display_order);
  };

  const handleExportPdf = (divisionId: string) => {
    const division = divisions.find((d) => d.id === divisionId);
    const standard = standards.find((s) => s.id === division?.standard_id);
    const divisionLabel = division ? `${standard?.name ?? ""} ${division.name}`.trim() : "Division";

    exportTimetableGridToPdf({
      divisionLabel,
      timetableName: timetable?.name ?? "Timetable",
      days: daysOfWeek.slice(0, 5),
      getTemplateSlotsForDay: (day) => getTemplateSlots(getSelectedTemplate(day)),
      getCell: (templateSlotId, day) => {
        const slot = getSlotForCell(divisionId, templateSlotId, day);
        return slot ? { subject_id: slot.subject_id, teacher_id: slot.teacher_id } : undefined;
      },
      getSubjectName: (subjectId) => subjects.find((s) => s.id === subjectId)?.name ?? "—",
      getTeacherName: (teacherId) => teachers.find((t) => t.id === teacherId)?.name ?? "—",
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="font-semibold">
          {isNewTimetable ? "New Timetable" : timetable?.name}
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "details" | "days" | "slots" | "generate")}
        className="flex-1 flex flex-col"
      >
        <TabsList className="m-4 w-fit">
          <TabsTrigger value="details">Details</TabsTrigger>
          {!isNewTimetable && <TabsTrigger value="days">Day Templates</TabsTrigger>}
          {!isNewTimetable && <TabsTrigger value="slots">Slot Grid</TabsTrigger>}
          {!isNewTimetable && <TabsTrigger value="generate">Generate Schedule</TabsTrigger>}
        </TabsList>

        <TabsContent value="details" className="flex-1 overflow-auto p-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Timetable Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Class 1A - 2025-26"
              className="mt-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">School Year</label>
            <Select value={selectedSchoolYear} onValueChange={setSelectedSchoolYear}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select school year" />
              </SelectTrigger>
              <SelectContent>
                {schoolYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Branch (Optional)</label>
            <Select value={selectedBranch || "all"} onValueChange={(v) => setSelectedBranch(v === "all" ? "" : v)}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Divisions
            </label>
            <div className="space-y-2 max-h-64 overflow-auto border rounded p-2">
              {getDivisionsWithStandard().map((division) => (
                <label
                  key={division.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedDivisions.has(division.id)}
                    onChange={() => toggleDivision(division.id)}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm">
                    {division.standardName} - {division.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <Button onClick={handleSaveDetails} disabled={saving} className="w-full">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isNewTimetable ? "Create Timetable" : "Save Changes"}
            </Button>
          </div>
        </TabsContent>

        {!isNewTimetable && (
          <>
            <TabsContent value="days" className="flex-1 overflow-auto p-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Assign a time template to each day. Days without a template have no classes scheduled.
              </p>
              {daysOfWeek.map((day) => (
                <div key={day} className="flex items-center gap-2 p-2 border rounded">
                  <span className="text-sm font-medium w-12">{day}</span>
                  <Select
                    value={getSelectedTemplate(day)}
                    onValueChange={(templateId) => handleSaveDayTemplate(day, templateId)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No class</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.template_slot?.length ?? 0} slots)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="slots" className="flex-1 overflow-auto p-4">
              {selectedDivisions.size > 1 && (
                <div className="mb-4 space-y-2">
                  <p className="text-xs font-medium">Select Division</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedDivisions).map((divId) => {
                      const div = divisions.find((d) => d.id === divId);
                      return (
                        <button
                          key={divId}
                          onClick={() => setActiveDivisionForGrid(divId)}
                          className={cn(
                            "px-3 py-1 text-xs rounded border transition-colors",
                            activeDivisionForGrid === divId
                              ? "bg-brand text-white border-brand"
                              : "bg-secondary border-border"
                          )}
                        >
                          {div?.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeDivisionForGrid || selectedDivisions.size === 1 ? (
                <>
                  <div className="mb-3 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        handleExportPdf(activeDivisionForGrid || Array.from(selectedDivisions)[0])
                      }
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export PDF
                    </Button>
                  </div>
                  <SlotGrid
                  timetable={timetable}
                  divisions={divisions}
                  activeDivisionId={
                    activeDivisionForGrid || Array.from(selectedDivisions)[0]
                  }
                  templates={templates}
                  dayTemplates={dayTemplates}
                  subjects={subjects}
                  teachers={teachers}
                  teacherAssignments={teacherAssignments}
                  existingSlots={existingSlots}
                  onSaveSlot={handleSaveSlot}
                  onClearSlot={handleClearSlot}
                  getSlotForCell={getSlotForCell}
                  />
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No divisions selected
                </div>
              )}
            </TabsContent>

            <TabsContent value="generate" className="flex-1 overflow-auto p-4">
              {selectedDivisions.size > 1 && (
                <div className="mb-4 space-y-2">
                  <p className="text-xs font-medium">Select Division</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedDivisions).map((divId) => {
                      const div = divisions.find((d) => d.id === divId);
                      return (
                        <button
                          key={divId}
                          onClick={() => setActiveDivisionForGrid(divId)}
                          className={cn(
                            "px-3 py-1 text-xs rounded border transition-colors",
                            activeDivisionForGrid === divId
                              ? "bg-brand text-white border-brand"
                              : "bg-secondary border-border"
                          )}
                        >
                          {div?.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {(() => {
                const generateDivisionId =
                  activeDivisionForGrid || Array.from(selectedDivisions)[0] || null;
                const division = divisions.find((d) => d.id === generateDivisionId) ?? null;
                const standard = division
                  ? standards.find((s) => s.id === division.standard_id) ?? null
                  : null;
                const schoolYear = timetable
                  ? schoolYears.find((sy) => sy.id === timetable.school_year_id) ?? null
                  : null;
                const divisionSlots = existingSlots.filter(
                  (slot) => slot.timetable_id === timetable?.id && slot.division_id === generateDivisionId
                );

                return (
                  <ScheduleGenerator
                    division={division}
                    schoolYear={schoolYear}
                    standard={standard}
                    segments={segments}
                    chapters={chapters}
                    slots={divisionSlots}
                  />
                );
              })()}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

type SlotGridProps = {
  timetable: Timetable;
  divisions: Division[];
  activeDivisionId: string;
  templates: Array<TimeTemplate & { template_slot?: Array<any> }>;
  dayTemplates: Record<string, string>;
  subjects: Subject[];
  teachers: Teacher[];
  teacherAssignments: TeacherAssignment[];
  existingSlots: TimetableSlot[];
  onSaveSlot: (
    divisionId: string,
    templateSlotId: string,
    dayOfWeek: string,
    subjectId: string,
    teacherId: string
  ) => Promise<void>;
  onClearSlot: (
    divisionId: string,
    templateSlotId: string,
    dayOfWeek: string
  ) => Promise<void>;
  getSlotForCell: (
    divisionId: string,
    templateSlotId: string,
    dayOfWeek: string
  ) => TimetableSlot | undefined;
};

function SlotGrid({
  timetable,
  divisions,
  activeDivisionId,
  templates,
  dayTemplates,
  subjects,
  teachers,
  teacherAssignments,
  existingSlots,
  onSaveSlot,
  onClearSlot,
  getSlotForCell,
}: SlotGridProps) {
  const activeDivisionStandardId = divisions.find((d) => d.id === activeDivisionId)?.standard_id;

  const daysWithTemplate = Object.entries(dayTemplates)
    .filter(([, templateId]) => templateId !== "none")
    .map(([day]) => day);

  const templateSlotsByDay: Record<string, Array<any>> = {};
  daysWithTemplate.forEach((day) => {
    const templateId = dayTemplates[day];
    if (templateId && templateId !== "none") {
      const template = templates.find((t) => t.id === templateId);
      templateSlotsByDay[day] = (template?.template_slot ?? [])
        .filter((slot: any) => slot.slot_type === "period" || slot.slot_type === "class")
        .sort((a: any, b: any) => a.display_order - b.display_order);
    }
  });

  const allSlots = new Set<string>();
  daysWithTemplate.forEach((day) => {
    (templateSlotsByDay[day] ?? []).forEach((slot: any) => {
      allSlots.add(slot.id);
    });
  });

  const slotsByDayAndId: Record<string, Array<any>> = {};
  daysWithTemplate.forEach((day) => {
    slotsByDayAndId[day] = templateSlotsByDay[day] ?? [];
  });

  if (daysWithTemplate.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No days with templates assigned
      </div>
    );
  }

  return (
    <div className="border rounded overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-2 py-2 text-left text-xs font-medium min-w-24">
              Period
            </th>
            {daysWithTemplate.map((day) => (
              <th key={day} className="px-2 py-2 text-left text-xs font-medium min-w-32">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from(allSlots).map((slotId) => {
            const firstSlot = (
              daysWithTemplate.length > 0 ? slotsByDayAndId[daysWithTemplate[0]] : []
            ).find((s: any) => s.id === slotId);

            if (!firstSlot) return null;

            return (
              <tr key={slotId} className="border-b">
                <td className="px-2 py-2 text-xs font-medium bg-muted/30">
                  {firstSlot.name}
                </td>
                {daysWithTemplate.map((day) => {
                  const slot = (slotsByDayAndId[day] ?? []).find(
                    (s: any) => s.id === slotId
                  );

                  if (!slot) {
                    return <td key={`${day}-${slotId}`} className="px-2 py-2" />;
                  }

                  const existingSlot = getSlotForCell(
                    activeDivisionId,
                    slot.id,
                    day
                  );
                  const subject = subjects.find(
                    (s) => s.id === existingSlot?.subject_id
                  );
                  const teacher = teachers.find(
                    (t) => t.id === existingSlot?.teacher_id
                  );

                  return (
                    <td
                      key={`${day}-${slotId}`}
                      className="px-2 py-2 border-r"
                    >
                      <SlotCell
                        divisionId={activeDivisionId}
                        templateSlotId={slot.id}
                        dayOfWeek={day}
                        existingSlot={existingSlot}
                        subject={subject}
                        teacher={teacher}
                        subjects={subjects}
                        standardId={activeDivisionStandardId}
                        teacherAssignments={teacherAssignments}
                        teachers={teachers}
                        onSave={onSaveSlot}
                        onClear={onClearSlot}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type SlotCellProps = {
  divisionId: string;
  templateSlotId: string;
  dayOfWeek: string;
  existingSlot: TimetableSlot | undefined;
  subject: Subject | undefined;
  teacher: Teacher | undefined;
  subjects: Subject[];
  standardId: string | undefined;
  teacherAssignments: TeacherAssignment[];
  teachers: Teacher[];
  onSave: (divisionId: string, templateSlotId: string, dayOfWeek: string, subjectId: string, teacherId: string) => Promise<void>;
  onClear: (divisionId: string, templateSlotId: string, dayOfWeek: string) => Promise<void>;
};

function SlotCell({
  divisionId,
  templateSlotId,
  dayOfWeek,
  existingSlot,
  subject,
  teacher,
  subjects,
  standardId,
  teacherAssignments,
  teachers,
  onSave,
  onClear,
}: SlotCellProps) {
  const [editMode, setEditMode] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(existingSlot?.subject_id ?? "");
  const [selectedTeacher, setSelectedTeacher] = useState(existingSlot?.teacher_id ?? "");
  const [saving, setSaving] = useState(false);

  if (!editMode && !existingSlot) {
    return (
      <button
        onClick={() => setEditMode(true)}
        className="w-full h-12 border border-dashed rounded flex items-center justify-center hover:bg-muted/50 transition"
      >
        <Plus className="w-3 h-3" />
      </button>
    );
  }

  if (!editMode && existingSlot) {
    return (
      <button
        onClick={() => setEditMode(true)}
        className="w-full h-12 p-1 border rounded bg-blue-50 text-xs hover:bg-blue-100 transition text-left"
      >
        <div className="font-medium text-blue-900">{subject?.name ?? "Unknown"}</div>
        <div className="text-blue-700 truncate">{teacher?.name ?? "Unassigned"}</div>
      </button>
    );
  }

  const availableSubjects = standardId
    ? subjects.filter((subj) => subj.standard_id === standardId)
    : subjects;

  const availableTeachers = teacherAssignments
    .filter((a) => a.division_id === divisionId && a.subject_id === selectedSubject)
    .map((a) => teachers.find((t) => t.id === a.teacher_id))
    .filter(Boolean);

  const handleSave = async () => {
    if (!selectedSubject || !selectedTeacher) {
      toast.error("Select both subject and teacher");
      return;
    }

    setSaving(true);
    try {
      await onSave(divisionId, templateSlotId, dayOfWeek, selectedSubject, selectedTeacher);
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await onClear(divisionId, templateSlotId, dayOfWeek);
      setEditMode(false);
      setSelectedSubject("");
      setSelectedTeacher("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2 p-2">
      <Select value={selectedSubject} onValueChange={setSelectedSubject}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Subject" />
        </SelectTrigger>
        <SelectContent>
          {availableSubjects.map((subj) => (
            <SelectItem key={subj.id} value={subj.id}>
              {subj.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Teacher" />
        </SelectTrigger>
        <SelectContent>
          {availableTeachers.map((t) => (
            <SelectItem key={t!.id} value={t!.id}>
              {t!.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex gap-1">
        <Button
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={handleSave}
          disabled={saving}
        >
          {saving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
          Save
        </Button>
        {existingSlot && (
          <Button
            size="sm"
            variant="destructive"
            className="h-7 text-xs flex-1"
            onClick={handleClear}
            disabled={saving}
          >
            Clear
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs flex-1"
          onClick={() => {
            setEditMode(false);
            setSelectedSubject(existingSlot?.subject_id ?? "");
            setSelectedTeacher(existingSlot?.teacher_id ?? "");
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
