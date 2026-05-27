"use client";

import { useMemo, useState } from "react";
import {
  Teacher, Subject, Division, Standard, SchoolYear, TeacherAssignment,
} from "@/lib/types";
import type { UserRole } from "@/lib/role-access";
import {
  createTeacherAssignment, deleteTeacherAssignment,
} from "@/lib/actions/setup";
import { useAction } from "@/lib/hooks/use-action";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface AssignmentsTabProps {
  teachers: Teacher[];
  subjects: Subject[];
  divisions: Division[];
  standards: Standard[];
  schoolYears: SchoolYear[];
  assignments: TeacherAssignment[];
}

const roleColors: Record<UserRole, { color: string; border: string; bg: string }> = {
  super_admin: { color: "#ba2032", border: "#f0b0b7", bg: "#fce8ea" },
  admin:       { color: "#ba2032", border: "#f0b0b7", bg: "#fce8ea" },
  coordinator: { color: "#185FA5", border: "#b5d4f4", bg: "#e6f1fb" },
  teacher:     { color: "#16803c", border: "#bbf7d0", bg: "#f0fdf4" },
};

function RoleBadge({ role }: { role: UserRole }) {
  const meta = roleColors[role];
  return (
    <Badge
      className="h-5 rounded border px-2 text-[11px] font-medium capitalize"
      style={{ color: meta.color, borderColor: meta.border, background: meta.bg }}
    >
      {role}
    </Badge>
  );
}

export function AssignmentsTab({
  teachers, subjects, divisions, standards, schoolYears, assignments,
}: AssignmentsTabProps) {
  const activeYear = schoolYears.find((y) => y.is_active);
  const activeTeachers = teachers.filter((teacher) => teacher.is_active);

  const [teacherId, setTeacherId]   = useState(activeTeachers[0]?.id ?? "");
  const [subjectId, setSubjectId]   = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [viewMode, setViewMode] = useState<"teacher" | "division">("teacher");

  const assignAction = useAction(createTeacherAssignment, {
    successMessage: "Assignment created",
  });

  // When subject changes, auto-filter divisions to that standard
  const selectedSubject  = subjects.find((s) => s.id === subjectId);
  const relevantDivisions = selectedSubject
    ? divisions.filter((d) => d.standard_id === selectedSubject.standard_id)
    : divisions;

  const conflict = teacherId && subjectId && divisionId
    ? assignments.find(
      (a) =>
        a.subject_id === subjectId &&
        a.division_id === divisionId &&
        a.school_year_id === activeYear?.id
    )
    : null;
  const conflictTeacher = conflict
    ? teachers.find((teacher) => teacher.id === conflict.teacher_id)
    : null;

  async function handleDelete(id: string) {
    const result = await deleteTeacherAssignment(id);
    if (result?.error) toast.error("Delete failed", { description: result.error });
    else toast.success("Assignment removed");
  }

  // Enrich assignments with names for display
  const enriched = assignments
    .map((a) => {
      const subject = subjects.find((s) => s.id === a.subject_id);
      const div = divisions.find((d) => d.id === a.division_id);
      const std = standards.find((s) => s.id === div?.standard_id);
      const teacher = teachers.find((t) => t.id === a.teacher_id);

      return {
        ...a,
        teacherName: teacher?.name ?? "Unknown",
        subjectName: subject?.name ?? "Unknown",
        divisionName: div && std ? `Std ${std.grade} · Div ${div.name}` : "Unknown",
        standardName: std ? `Std ${std.grade}` : "Unknown",
        divisionOnlyName: div ? `Div ${div.name}` : "Unknown",
        role: teacher?.role ?? "teacher",
      };
    })
    .sort((a, b) => a.teacherName.localeCompare(b.teacherName));

  const byTeacher = useMemo(() => {
    const groups = new Map<string, typeof enriched>();
    enriched.forEach((assignment) => {
      const key = assignment.teacherName;
      groups.set(key, [...(groups.get(key) ?? []), assignment]);
    });
    return Array.from(groups.entries());
  }, [enriched]);

  const byDivision = useMemo(() => {
    const groups = new Map<string, typeof enriched>();
    enriched
      .slice()
      .sort((a, b) => a.divisionName.localeCompare(b.divisionName) || a.subjectName.localeCompare(b.subjectName))
      .forEach((assignment) => {
        const key = `${assignment.standardName} · ${assignment.divisionOnlyName}`;
        groups.set(key, [...(groups.get(key) ?? []), assignment]);
      });
    return Array.from(groups.entries());
  }, [enriched]);

  return (
    <div className="min-h-full bg-[#FAFAFA]">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#171717]">Teacher Allocation</h1>
        <p className="mt-1 text-sm text-[#737373]">Assign teachers to subjects and classes.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="gap-0 rounded-lg border-[#E5E5E5] bg-white py-0 shadow-none">
          <CardHeader className="border-b border-[#E5E5E5] px-4 py-3">
            <CardTitle className="text-sm font-semibold text-[#171717]">Add allocation</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {!activeYear && (
              <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                No active school year. Set one in the School Year tab first.
              </div>
            )}

            <form
              onSubmit={assignAction.handleSubmit}
              className="flex flex-col gap-3"
            >
              <input type="hidden" name="school_year_id" value={activeYear?.id ?? ""} />
              <input type="hidden" name="division_id" value={divisionId} />
              <input type="hidden" name="subject_id" value={subjectId} />
              <input type="hidden" name="teacher_id" value={teacherId} />

              <div className="flex flex-col gap-1.5">
                <Label>Teacher</Label>
                <Select value={teacherId} onValueChange={setTeacherId}>
                  <SelectTrigger className="h-8 rounded-md border-[#D4D4D4]">
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTeachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <span>{t.name}</span>
                          <RoleBadge role={t.role} />
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Subject</Label>
                <Select
                  value={subjectId}
                  onValueChange={(v) => {
                    setSubjectId(v);
                    setDivisionId("");
                  }}
                >
                  <SelectTrigger className="h-8 rounded-md border-[#D4D4D4]">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {standards.map((std) => {
                      const stdSubjects = subjects.filter(
                        (s) => s.standard_id === std.id
                      );
                      if (stdSubjects.length === 0) return null;
                      return (
                        <div key={std.id}>
                          <div className="px-2 py-1 text-[11px] font-medium uppercase text-[#A3A3A3]">
                            {std.name}
                          </div>
                          {stdSubjects.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </div>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Division</Label>
                <Select
                  value={divisionId}
                  onValueChange={setDivisionId}
                  disabled={!subjectId}
                >
                  <SelectTrigger className="h-8 rounded-md border-[#D4D4D4]">
                    <SelectValue
                      placeholder={
                        subjectId ? "Select division" : "Select subject first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {relevantDivisions.map((d) => {
                      const std = standards.find((s) => s.id === d.standard_id);
                      return (
                        <SelectItem key={d.id} value={d.id}>
                          {std ? `Std ${std.grade} · Div ${d.name}` : `Div ${d.name}`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {conflictTeacher && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  This subject already has <span className="font-medium">{conflictTeacher.name}</span> assigned to this division.
                </div>
              )}

              <Button
                type="submit"
                disabled={
                  assignAction.loading ||
                  !teacherId ||
                  !subjectId ||
                  !divisionId ||
                  !activeYear
                }
                className="h-8 w-full rounded-md bg-[#ba2032] text-white hover:bg-[#ba2032]"
              >
                {assignAction.loading
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Adding...</>
                  : <><Plus className="h-3.5 w-3.5" />Add allocation</>
                }
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="gap-0 rounded-lg border-[#E5E5E5] bg-white py-0 shadow-none">
          <CardHeader className="border-b border-[#E5E5E5] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold text-[#171717]">Allocations</CardTitle>
                <Badge variant="outline" className="h-5 rounded px-2 text-[11px] font-medium">
                  {assignments.length}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  className={[
                    "h-8 rounded-md px-3 text-xs",
                    viewMode === "teacher" ? "bg-[#171717] text-white hover:bg-[#171717] hover:text-white" : "bg-[#F5F5F5] text-[#525252] hover:bg-[#F5F5F5]",
                  ].join(" ")}
                  onClick={() => setViewMode("teacher")}
                >
                  By Teacher
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className={[
                    "h-8 rounded-md px-3 text-xs",
                    viewMode === "division" ? "bg-[#171717] text-white hover:bg-[#171717] hover:text-white" : "bg-[#F5F5F5] text-[#525252] hover:bg-[#F5F5F5]",
                  ].join(" ")}
                  onClick={() => setViewMode("division")}
                >
                  By Division
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {enriched.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center text-xs text-[#737373]">
                <UserCheck className="mb-2 h-8 w-8 text-[#A3A3A3]" />
                <p className="font-medium text-[#525252]">No allocations yet</p>
                <p className="mt-0.5">Assign teachers to subjects above</p>
              </div>
            ) : viewMode === "teacher" ? (
              <div>
                {byTeacher.map(([teacherName, rows]) => (
                  <div key={teacherName} className="border-b border-[#F5F5F5] last:border-b-0">
                    <div className="flex h-9 items-center gap-2 bg-[#FAFAFA] px-4">
                      <span className="text-xs font-semibold text-[#171717]">{teacherName}</span>
                      <RoleBadge role={rows[0]?.role ?? "teacher"} />
                    </div>
                    {rows.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="group flex min-h-11 items-center justify-between border-b border-[#F5F5F5] px-4 last:border-b-0 hover:bg-[#FAFAFA]"
                      >
                        <div className="min-w-0 text-sm text-[#171717]">
                          <span className="font-medium">{assignment.subjectName}</span>
                          <span className="px-1.5 text-[#A3A3A3]">·</span>
                          <span className="text-[#737373]">{assignment.divisionName}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-md text-[#525252] hover:bg-[#F5F5F5]"
                          onClick={() => handleDelete(assignment.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {byDivision.map(([divisionName, rows]) => (
                  <div key={divisionName} className="border-b border-[#F5F5F5] last:border-b-0">
                    <div className="flex h-9 items-center bg-[#FAFAFA] px-4">
                      <span className="text-xs font-semibold text-[#171717]">{divisionName}</span>
                    </div>
                    {rows.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="group flex min-h-11 items-center justify-between border-b border-[#F5F5F5] px-4 last:border-b-0 hover:bg-[#FAFAFA]"
                      >
                        <div className="min-w-0 text-sm text-[#171717]">
                          <span className="font-medium">{assignment.subjectName}</span>
                          <span className="px-1.5 text-[#A3A3A3]">·</span>
                          <span className="text-[#737373]">{assignment.teacherName}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-md text-[#525252] hover:bg-[#F5F5F5]"
                          onClick={() => handleDelete(assignment.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
