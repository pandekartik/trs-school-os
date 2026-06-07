import { redirect } from "next/navigation";
import { getLandingRoute, getRole, getTeacherProfile } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { TimetableBuilderShell } from "@/components/timetable/timetable-builder-shell";
import type {
  AcademicSegment,
  DivisionTemplate,
  TeacherAssignment,
  TimetableActivation,
  TimetableSlot,
} from "@/lib/types";

export default async function TimetableBuilderPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const db = await createServerClient();
  const profile = await getTeacherProfile();

  let teacherQuery = db.from("teacher").select("*").eq("role", "teacher");
  if (branchId) {
    teacherQuery = teacherQuery.eq("branch_id", branchId);
  }

  let templateQuery = db.from("time_template").select("*, template_slot(*)").order("created_at", { ascending: false });
  if (branchId) {
    templateQuery = templateQuery.eq("branch_id", branchId);
  }

  let slotQuery = db.from("timetable_slot").select("*");
  if (branchId) {
    slotQuery = slotQuery.eq("branch_id", branchId);
  }

  let activationQuery = db.from("timetable_activation").select("*");
  if (branchId) {
    activationQuery = activationQuery.eq("branch_id", branchId);
  }

  const [
    { data: standards },
    { data: divisions },
    { data: subjects },
    { data: teachers },
    { data: teacherAssignments },
    { data: templates },
    { data: divisionTemplates },
    { data: timetableSlots },
    { data: activations },
    { data: segments },
    { data: activeSchoolYears },
  ] = await Promise.all([
    db.from("standard").select("*").order("grade"),
    db.from("division").select("*").order("name"),
    db.from("subject").select("*").order("name"),
    teacherQuery.order("name"),
    db.from("teacher_assignment").select("*"),
    templateQuery,
    db.from("division_template").select("*"),
    slotQuery,
    activationQuery,
    db.from("academic_segment").select("*").order("sequence_number"),
    db.from("school_year").select("*").eq("is_active", true).order("created_at", { ascending: false }),
  ]);

  return (
    <TimetableBuilderShell
      standards={standards ?? []}
      divisions={divisions ?? []}
      subjects={subjects ?? []}
      teachers={teachers ?? []}
      teacherAssignments={(teacherAssignments ?? []) as TeacherAssignment[]}
      templates={templates ?? []}
      divisionTemplates={(divisionTemplates ?? []) as DivisionTemplate[]}
      timetableSlots={(timetableSlots ?? []) as TimetableSlot[]}
      activations={(activations ?? []) as TimetableActivation[]}
      segments={(segments ?? []) as AcademicSegment[]}
      activeSchoolYear={activeSchoolYears?.[0] ?? null}
      currentTeacherId={profile?.id ?? ""}
    />
  );
}
