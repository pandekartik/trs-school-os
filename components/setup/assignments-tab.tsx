"use client";

import { useState } from "react";
import {
  Teacher, Subject, Division, Standard, SchoolYear, TeacherAssignment,
} from "@/lib/types";
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
import { Loader2, Plus, Trash2, GraduationCap } from "lucide-react";
import { toast } from "sonner";

interface AssignmentsTabProps {
  teachers: Teacher[];
  subjects: Subject[];
  divisions: Division[];
  standards: Standard[];
  schoolYears: SchoolYear[];
  assignments: TeacherAssignment[];
}

export function AssignmentsTab({
  teachers, subjects, divisions, standards, schoolYears, assignments,
}: AssignmentsTabProps) {
  const activeYear = schoolYears.find((y) => y.is_active);

  const [teacherId, setTeacherId]   = useState(teachers[0]?.id ?? "");
  const [subjectId, setSubjectId]   = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [filterTeacher, setFilterTeacher] = useState<string>("all");

  const assignAction = useAction(createTeacherAssignment, {
    successMessage: "Assignment created",
  });

  // When subject changes, auto-filter divisions to that standard
  const selectedSubject  = subjects.find((s) => s.id === subjectId);
  const relevantDivisions = selectedSubject
    ? divisions.filter((d) => d.standard_id === selectedSubject.standard_id)
    : divisions;

  async function handleDelete(id: string) {
    const result = await deleteTeacherAssignment(id);
    if (result?.error) toast.error("Delete failed", { description: result.error });
    else toast.success("Assignment removed");
  }

  // Enrich assignments with names for display
  const enriched = assignments
    .filter((a) =>
      filterTeacher === "all" || a.teacher_id === filterTeacher
    )
    .map((a) => ({
      ...a,
      teacherName: teachers.find((t) => t.id === a.teacher_id)?.name ?? "Unknown",
      subjectName: subjects.find((s) => s.id === a.subject_id)?.name ?? "Unknown",
      divisionName: (() => {
        const div = divisions.find((d) => d.id === a.division_id);
        const std = standards.find((s) => s.id === div?.standard_id);
        return div && std ? `${std.name} – Div ${div.name}` : "Unknown";
      })(),
      role: teachers.find((t) => t.id === a.teacher_id)?.role ?? "teacher",
    }))
    .sort((a, b) => a.teacherName.localeCompare(b.teacherName));

  const roleColors: Record<string, { color: string; border: string; bg: string }> = {
    admin:       { color: "#a01b2b", border: "#f0b0b7", bg: "#fce8ea" },
    hod:         { color: "#534AB7", border: "#afa9ec", bg: "#eeedfe" },
    coordinator: { color: "#185FA5", border: "#b5d4f4", bg: "#e6f1fb" },
    teacher:     { color: "#3B6D11", border: "#c0dd97", bg: "#eaf3de" },
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Left — form */}
      <Card>
        <CardHeader>
          <CardTitle>Assign teacher to subject</CardTitle>
        </CardHeader>
        <CardContent>
          {!activeYear && (
            <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700 mb-3">
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
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <span>{t.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          ({t.role})
                        </span>
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
                <SelectTrigger>
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
                        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                <SelectTrigger>
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
                        {std?.name} — Division {d.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Conflict warning */}
            {teacherId && subjectId && divisionId && (() => {
              const conflict = assignments.find(
                (a) =>
                  a.subject_id === subjectId &&
                  a.division_id === divisionId &&
                  a.school_year_id === activeYear?.id
              );
              if (conflict) {
                const existing = teachers.find((t) => t.id === conflict.teacher_id);
                return (
                  <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                    ⚠ This subject + division is already assigned to{" "}
                    <span className="font-medium">{existing?.name}</span>.
                    Creating this will add a second teacher.
                  </div>
                );
              }
              return null;
            })()}

            <Button
              type="submit"
              disabled={
                assignAction.loading ||
                !teacherId ||
                !subjectId ||
                !divisionId ||
                !activeYear
              }
              className="w-full"
            >
              {assignAction.loading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Assigning...</>
                : <><Plus className="h-3.5 w-3.5" />Create assignment</>
              }
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Right — assignment list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Assignments
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-normal">
                {assignments.length} total
              </Badge>
              <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                <SelectTrigger className="h-7 text-xs w-36">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All teachers</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {enriched.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p>No assignments yet.</p>
              <p className="mt-0.5">Use the form to assign teachers.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {enriched.map((a) => {
                const meta = roleColors[a.role] ?? roleColors.teacher;
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg border bg-secondary/40 hover:bg-secondary/60 transition-colors"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium truncate">
                          {a.teacherName}
                        </span>
                        <Badge
                          className="text-[10px] h-5 px-2 font-normal border shrink-0"
                          style={{
                            color: meta.color,
                            borderColor: meta.border,
                            background: meta.bg,
                          }}
                        >
                          {a.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span
                          className="font-medium"
                          style={{ color: "var(--color-brand)" }}
                        >
                          {a.subjectName}
                        </span>
                        <span>·</span>
                        <span>{a.divisionName}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 ml-2"
                      onClick={() => handleDelete(a.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
