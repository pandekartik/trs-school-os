"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  assignDivisionTemplate,
  draftTimetable,
  randomlyAssignSlots,
} from "@/lib/actions/timetable";
import type {
  AcademicSegment,
  Division,
  DivisionTemplate,
  SchoolYear,
  Standard,
  Subject,
  Teacher,
  TeacherAssignment,
  TemplateSlot,
  TimeTemplate,
  TimetableActivation,
  TimetableSlot,
} from "@/lib/types";
import { TimetableGrid } from "@/components/timetable/timetable-grid";
import { FinalizeModal } from "@/components/timetable/finalize-modal";

export type TemplateWithSlots = TimeTemplate & { template_slot?: TemplateSlot[] };

type TimetableBuilderShellProps = {
  standards: Standard[];
  divisions: Division[];
  subjects: Subject[];
  teachers: Teacher[];
  teacherAssignments: TeacherAssignment[];
  templates: TemplateWithSlots[];
  divisionTemplates: DivisionTemplate[];
  timetableSlots: TimetableSlot[];
  activations: TimetableActivation[];
  segments: AcademicSegment[];
  activeSchoolYear: SchoolYear | null;
  currentTeacherId: string;
};

function statusMeta(status: "not-started" | "draft" | "finalized") {
  if (status === "finalized") return { label: "Finalized", className: "border-green-200 bg-green-50 text-green-700" };
  if (status === "draft") return { label: "Draft", className: "border-amber-200 bg-amber-50 text-amber-700" };
  return { label: "Not started", className: "border-[#E5E5E5] bg-[#F5F5F5] text-[#525252]" };
}

function isClassSlot(slot: TemplateSlot) {
  return slot.slot_type === "period" || slot.slot_type === "class";
}

export function TimetableBuilderShell({
  standards,
  divisions,
  subjects,
  teachers,
  teacherAssignments,
  templates,
  divisionTemplates,
  timetableSlots,
  activations,
  segments,
  activeSchoolYear,
  currentTeacherId,
}: TimetableBuilderShellProps) {
  const [selectedStandardId, setSelectedStandardId] = useState<string | null>(standards[0]?.id ?? null);
  const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(null);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const visibleDivisions = divisions.filter((division) => division.standard_id === selectedStandardId);
  const selectedDivision = divisions.find((division) => division.id === selectedDivisionId) ?? null;
  const standardSegments = segments.filter((segment) => segment.standard_id === selectedStandardId);

  const weekdayAssignment = divisionTemplates.find(
    (assignment) => assignment.division_id === selectedDivisionId && assignment.applies_to === "weekday"
  );
  const saturdayAssignment = divisionTemplates.find(
    (assignment) => assignment.division_id === selectedDivisionId && assignment.applies_to === "saturday"
  );
  const weekdayTemplate = templates.find((template) => template.id === weekdayAssignment?.template_id) ?? null;
  const saturdayTemplate = templates.find((template) => template.id === saturdayAssignment?.template_id) ?? null;
  const selectedSlots = timetableSlots.filter((slot) => slot.division_id === selectedDivisionId);
  const selectedActivations = activations.filter((activation) => activation.division_id === selectedDivisionId);
  const isFinalized = selectedActivations.some((activation) => activation.status === "finalized");
  const hasDraftWork = Boolean(weekdayAssignment || selectedSlots.length > 0 || selectedActivations.some((activation) => activation.status === "draft"));
  const status = isFinalized ? "finalized" : hasDraftWork ? "draft" : "not-started";
  const meta = statusMeta(status);

  const classSlots = (weekdayTemplate?.template_slot ?? []).filter(isClassSlot);
  const totalClassSlots = (weekdayTemplate?.days.length ?? 0) * classSlots.length;
  const filledClassSlots = useMemo(() => {
    if (!weekdayTemplate) return 0;
    const classSlotIds = new Set(classSlots.map((slot) => slot.id));
    return selectedSlots.filter((slot) => slot.template_slot_id && classSlotIds.has(slot.template_slot_id)).length;
  }, [classSlots, selectedSlots, weekdayTemplate]);

  async function handleTemplateAssign(templateId: string, appliesTo: "weekday" | "saturday") {
    if (!selectedDivisionId) return;
    const result = await assignDivisionTemplate(selectedDivisionId, templateId, appliesTo);
    if (result?.error) toast.error("Template assignment failed", { description: result.error });
    else toast.success("Template assigned");
  }

  function handleDraft() {
    const finalized = selectedActivations.find((activation) => activation.status === "finalized");
    if (!selectedDivisionId || !finalized) return;
    const confirmed = window.confirm("Moving to draft will hide schedule from teachers");
    if (!confirmed) return;

    startTransition(async () => {
      const result = await draftTimetable(selectedDivisionId, finalized.segment_id);
      if (result?.error) toast.error("Could not move to draft", { description: result.error });
      else toast.success("Timetable moved to draft");
    });
  }

  function handleRandomAssign() {
    if (!selectedDivisionId) return;
    const confirmed = window.confirm("This will randomly assign subjects and teachers to all empty slots. Continue?");
    if (!confirmed) return;

    startTransition(async () => {
      const result = await randomlyAssignSlots(selectedDivisionId);
      if (result?.error) toast.error("Random assignment failed", { description: result.error });
      else if (result?.warning) toast.success("Random assignment completed", { description: result.warning });
      else toast.success("All slots randomly assigned");
    });
  }

  return (
    <div className="min-h-full bg-[#FAFAFA]">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#171717]">Timetable</h1>
        <p className="mt-1 text-sm text-[#737373]">Build division schedules from reusable time templates.</p>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {standards.map((standard) => {
            const selected = standard.id === selectedStandardId;
            return (
              <button
                key={standard.id}
                type="button"
                className={`h-7 rounded-md px-3 text-xs font-medium transition-colors ${
                  selected ? "text-white" : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]"
                }`}
                style={selected ? { backgroundColor: "var(--color-brand)" } : undefined}
                onClick={() => {
                  setSelectedStandardId(standard.id);
                  setSelectedDivisionId(null);
                }}
              >
                {standard.name}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {visibleDivisions.map((division) => {
              const selected = division.id === selectedDivisionId;
              return (
                <button
                  key={division.id}
                  type="button"
                  className={`h-7 rounded-md px-3 text-xs font-medium transition-colors ${
                    selected ? "text-white" : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]"
                  }`}
                  style={selected ? { backgroundColor: "var(--color-brand)" } : undefined}
                  onClick={() => setSelectedDivisionId(division.id)}
                >
                  Div {division.name}
                </button>
              );
            })}
          </div>
          {selectedDivision && (
            <Badge className={["h-5 rounded border px-2 text-[11px] font-medium", meta.className].join(" ")}>
              {meta.label}
            </Badge>
          )}
        </div>
      </div>

      {selectedDivision && (
        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-[#E5E5E5] bg-white px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--color-text-secondary)" }}>Weekday template:</span>
            <span style={{ color: "var(--color-text-primary)" }} className="font-medium">{weekdayTemplate?.name ?? "Not assigned"}</span>
            <Select value={weekdayTemplate?.id ?? ""} onValueChange={(value) => handleTemplateAssign(value, "weekday")}>
              <SelectTrigger style={{ borderColor: "var(--color-border)" }} className="h-8 w-40 rounded-md text-xs">
                <SelectValue placeholder={weekdayTemplate ? "Change" : "Assign"} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--color-text-secondary)" }}>Saturday template:</span>
            <span style={{ color: "var(--color-text-primary)" }} className="font-medium">{saturdayTemplate?.name ?? "Not assigned"}</span>
            <Select value={saturdayTemplate?.id ?? ""} onValueChange={(value) => handleTemplateAssign(value, "saturday")}>
              <SelectTrigger style={{ borderColor: "var(--color-border)" }} className="h-8 w-40 rounded-md text-xs">
                <SelectValue placeholder={saturdayTemplate ? "Change" : "Assign"} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {!selectedDivision ? (
        <div className="flex min-h-96 flex-col items-center justify-center rounded-lg border border-[#E5E5E5] bg-white text-center">
          <CalendarDays className="mb-3 h-10 w-10 text-[#A3A3A3]" />
          <p className="text-sm font-medium text-[#171717]">Select a standard and division to build their timetable</p>
        </div>
      ) : !weekdayTemplate ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Assign a weekday template to start building the timetable
        </div>
      ) : (
        <>
          <TimetableGrid
            division={selectedDivision}
            template={weekdayTemplate}
            templateSlots={[...(weekdayTemplate.template_slot ?? [])].sort((a, b) => a.display_order - b.display_order)}
            existingSlots={selectedSlots}
            subjects={subjects}
            teachers={teachers}
            teacherAssignments={teacherAssignments}
          />
          <div className="sticky bottom-0 mt-4 flex h-[52px] items-center justify-between border-t border-[#E5E5E5] bg-white px-6">
            <div className="text-sm text-[#525252]">
              <span className="font-medium text-[#171717]">{filledClassSlots}</span> of {totalClassSlots} class slots filled
            </div>
            <div className="flex items-center gap-2">
              <Badge className={["h-5 rounded border px-2 text-[11px] font-medium", meta.className].join(" ")}>
                {meta.label}
              </Badge>
              {status === "finalized" ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="h-8 rounded-md border-[#E5E5E5] bg-[#F5F5F5] text-[#171717]"
                  onClick={handleDraft}
                  disabled={isPending}
                >
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-8 rounded-md border-[#E5E5E5] bg-[#F5F5F5] text-[#525252] text-xs"
                    onClick={handleRandomAssign}
                    disabled={isPending}
                  >
                    Random Fill (temp)
                  </Button>
                  <Button
                    type="button"
                    className="h-8 rounded-md bg-[#ba2032] text-white hover:bg-[#ba2032]"
                    onClick={() => setShowFinalizeModal(true)}
                    disabled={!activeSchoolYear}
                  >
                    Finalize
                  </Button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {selectedDivision && (
        <FinalizeModal
          open={showFinalizeModal}
          onOpenChange={setShowFinalizeModal}
          division={selectedDivision}
          segments={standardSegments}
          activations={activations}
          currentTeacherId={currentTeacherId}
        />
      )}
    </div>
  );
}
