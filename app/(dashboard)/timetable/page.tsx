import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { TimetableShell } from "@/components/timetable/timetable-shell";

export default async function TimetablePage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const admin = createAdminClient();

  // Fetch timetables
  const { data: timetables } = await admin
    .from("timetable")
    .select(
      `
      *,
      timetable_division(division_id),
      timetable_day_template(*)
      `
    )
    .order("created_at", { ascending: false });

  // Fetch active school years
  const { data: school_years } = await admin
    .from("school_year")
    .select("*")
    .eq("is_active", true)
    .order("name");

  // Fetch standards and divisions
  const { data: standards } = await admin
    .from("standard")
    .select("*")
    .order("grade");

  const { data: divisions } = await admin
    .from("division")
    .select("*")
    .order("standard_id, name");

  // Fetch subjects
  const { data: subjects } = await admin
    .from("subject")
    .select("*")
    .order("name");

  // Fetch teachers (role = teacher)
  const { data: teachers } = await admin
    .from("teacher")
    .select("*")
    .eq("role", "teacher")
    .eq("is_active", true)
    .order("name");

  // Fetch time templates with their slots
  const { data: time_templates } = await admin
    .from("time_template")
    .select(
      `
      *,
      template_slot(*)
      `
    )
    .order("name");

  // Fetch teacher assignments for active school year
  const { data: activeSchoolYear } = await admin
    .from("school_year")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  let teacher_assignments = [];
  if (activeSchoolYear) {
    const { data: assignments } = await admin
      .from("teacher_assignment")
      .select("*")
      .eq("school_year_id", activeSchoolYear.id);
    teacher_assignments = assignments ?? [];
  }

  // Fetch branches
  const { data: branches } = await admin
    .from("branch")
    .select("*")
    .eq("is_active", true)
    .order("name");

  // Fetch timetable slots for active school year
  let timetable_slots = [];
  if (activeSchoolYear) {
    const { data: slots } = await admin
      .from("timetable_slot")
      .select("*")
      .eq("school_year_id", activeSchoolYear.id);
    timetable_slots = slots ?? [];
  }

  return (
    <TimetableShell
      timetables={timetables ?? []}
      school_years={school_years ?? []}
      standards={standards ?? []}
      divisions={divisions ?? []}
      subjects={subjects ?? []}
      teachers={teachers ?? []}
      time_templates={time_templates ?? []}
      teacher_assignments={teacher_assignments}
      branches={branches ?? []}
      timetable_slots={timetable_slots}
      role={role}
    />
  );
}
