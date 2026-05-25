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
  if (role !== "admin") redirect(role ? getLandingRoute(role) : "/sign-in");

  const db = await createServerClient();
  const profile = await getTeacherProfile();

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
    db.from("teacher").select("*").order("name"),
    db.from("teacher_assignment").select("*"),
    db.from("time_template").select("*, template_slot(*)").order("created_at", { ascending: false }),
    db.from("division_template").select("*"),
    db.from("timetable_slot").select("*"),
    db.from("timetable_activation").select("*"),
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
