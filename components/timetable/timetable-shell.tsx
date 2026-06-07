"use client";

import { useState } from "react";
import type {
  Timetable,
  Branch,
  SchoolYear,
  Standard,
  Division,
  Subject,
  Teacher,
  TeacherAssignment,
  TimeTemplate,
  TimetableSlot,
} from "@/lib/types";
import type { UserRole } from "@/lib/role-access";
import {
  deleteTimetable,
  finalizeTimetable,
  draftTimetable,
} from "@/lib/actions/timetable";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarDays, Plus, Trash2, Pencil, Grid3x3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TimetablePanel } from "./timetable-panel";
import { SlideOver } from "@/components/ui/slide-over";

type Props = {
  timetables: Array<Timetable & { timetable_division?: Array<{ division_id: string }>; timetable_day_template?: Array<{ day_of_week: string }> }>;
  school_years: SchoolYear[];
  standards: Standard[];
  divisions: Division[];
  subjects: Subject[];
  teachers: Teacher[];
  time_templates: Array<TimeTemplate & { template_slot?: Array<any> }>;
  teacher_assignments: TeacherAssignment[];
  branches: Branch[];
  timetable_slots: TimetableSlot[];
  role?: UserRole | null;
};

export function TimetableShell({
  timetables,
  school_years,
  standards,
  divisions,
  subjects,
  teachers,
  time_templates,
  teacher_assignments,
  branches,
  timetable_slots,
}: Props) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState<typeof timetables[0] | null>(null);
  const [panelView, setPanelView] = useState<"form" | "builder">("form");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [timetableToDelete, setTimetableToDelete] = useState<typeof timetables[0] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [finalizing, setFinalizing] = useState<string | null>(null);

  function handleAddTimetable() {
    setSelectedTimetable(null);
    setPanelView("form");
    setPanelOpen(true);
  }

  function handleEditTimetable(timetable: typeof timetables[0]) {
    setSelectedTimetable(timetable);
    setPanelView("form");
    setPanelOpen(true);
  }

  function handleOpenBuilder(timetable: typeof timetables[0]) {
    setSelectedTimetable(timetable);
    setPanelView("builder");
    setPanelOpen(true);
  }

  function handleClose() {
    setPanelOpen(false);
    setSelectedTimetable(null);
    setPanelView("form");
  }

  async function handleConfirmDelete() {
    if (!timetableToDelete) return;

    setDeleting(true);
    try {
      const result = await deleteTimetable(timetableToDelete.id);
      if (result?.error) {
        toast.error("Delete failed", { description: result.error });
      } else {
        toast.success("Timetable deleted");
        setDeleteDialogOpen(false);
        setTimetableToDelete(null);
        window.location.reload();
      }
    } catch (err) {
      toast.error("Error deleting timetable");
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleFinalize(timetable: typeof timetables[0]) {
    setFinalizing(timetable.id);
    try {
      let result;
      if (timetable.status === "draft") {
        result = await finalizeTimetable(timetable.id, "user");
      } else {
        result = await draftTimetable(timetable.id);
      }

      if (result?.error) {
        toast.error("Update failed", { description: result.error });
      } else {
        toast.success(
          timetable.status === "draft" ? "Timetable finalized" : "Timetable reverted to draft"
        );
        window.location.reload();
      }
    } catch (err) {
      toast.error("Error updating timetable status");
    } finally {
      setFinalizing(null);
    }
  }

  const getDivisionNames = (timetable: typeof timetables[0]) => {
    const divisionIds =
      timetable.timetable_division?.map((td) => td.division_id) ?? [];
    const names = divisionIds
      .map((id) => divisions.find((d) => d.id === id)?.name)
      .filter(Boolean);

    if (names.length <= 3) return names.join(", ");
    return `${names.slice(0, 3).join(", ")} +${names.length - 3}`;
  };

  const getDaysWithTemplate = (timetable: typeof timetables[0]) => {
    return timetable.timetable_day_template?.map((t) => t.day_of_week) ?? [];
  };

  const countSlots = (timetable: typeof timetables[0]) => {
    const divisionIds =
      timetable.timetable_division?.map((td) => td.division_id) ?? [];
    const filled = timetable_slots.filter(
      (slot) => slot.timetable_id === timetable.id && divisionIds.includes(slot.division_id)
    ).length;
    const total = divisionIds.length * (time_templates.flatMap((t) => t.template_slot ?? []).length || 10) || 0;
    return { filled, total };
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Timetable"
          subtitle="Manage weekly class schedules across divisions."
          rightContent={
            <Button onClick={handleAddTimetable} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Timetable
            </Button>
          }
        />

        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">
              All timetables{" "}
              <Badge variant="outline" className="ml-2">
                {timetables.length}
              </Badge>
            </h3>
          </div>

          {timetables.length === 0 ? (
            <div className="card-body flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="w-12 h-12 text-muted-foreground mb-3" />
              <h4 className="font-semibold">No timetables yet</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first timetable
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>NAME</TableHead>
                  <TableHead>DIVISIONS</TableHead>
                  <TableHead>DAYS</TableHead>
                  <TableHead>SLOTS</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead className="text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timetables.map((timetable) => {
                  const { filled, total } = countSlots(timetable);
                  const daysWithTemplate = getDaysWithTemplate(timetable);

                  return (
                    <TableRow key={timetable.id}>
                      <TableCell className="text-xs text-muted-foreground mono font-mono">
                        {timetable.display_id}
                      </TableCell>
                      <TableCell className="font-medium">{timetable.name}</TableCell>
                      <TableCell className="text-sm">
                        {getDivisionNames(timetable)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {["MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                            (day) =>
                              daysWithTemplate.includes(day) && (
                                <Badge key={day} variant="secondary" className="text-xs">
                                  {day}
                                </Badge>
                              )
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {filled} / {total}
                      </TableCell>
                      <TableCell>
                        {timetable.status === "draft" ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700">
                            Draft
                          </Badge>
                        ) : (
                          <Badge className="bg-green-600">Finalized</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTimetable(timetable)}
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenBuilder(timetable)}
                            title="Open builder"
                          >
                            <Grid3x3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={finalizing === timetable.id}
                            onClick={() => handleToggleFinalize(timetable)}
                            title={
                              timetable.status === "draft"
                                ? "Finalize"
                                : "Revert to draft"
                            }
                          >
                            {finalizing === timetable.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <span className="text-xs font-medium">
                                {timetable.status === "draft" ? "Finalize" : "Draft"}
                              </span>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTimetableToDelete(timetable);
                              setDeleteDialogOpen(true);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <SlideOver
        open={panelOpen}
        onOpenChange={setPanelOpen}
        side="right"
        width="640px"
      >
        {panelOpen && selectedTimetable && (
          <TimetablePanel
            timetable={selectedTimetable}
            divisions={divisions}
            standards={standards}
            templates={time_templates}
            subjects={subjects}
            teachers={teachers}
            teacherAssignments={teacher_assignments}
            existingSlots={timetable_slots}
            branches={branches}
            onClose={handleClose}
            panelView={panelView}
          />
        )}
        {panelOpen && !selectedTimetable && (
          <TimetablePanel
            timetable={null}
            divisions={divisions}
            standards={standards}
            templates={time_templates}
            subjects={subjects}
            teachers={teachers}
            teacherAssignments={teacher_assignments}
            existingSlots={timetable_slots}
            branches={branches}
            onClose={handleClose}
            panelView={panelView}
            schoolYears={school_years}
          />
        )}
      </SlideOver>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Timetable?</DialogTitle>
            <DialogDescription>
              This will permanently delete "{timetableToDelete?.name}". This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
