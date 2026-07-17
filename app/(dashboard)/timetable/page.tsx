import { getRole, getActiveBranch } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { TimetableShell } from "@/components/timetable/timetable-shell";

export default async function TimetablePage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const admin = createAdminClient();
  const activeBranch = await getActiveBranch();

  // Fetch timetables for the active branch
  let timetablesQuery = admin
    .from("timetable")
    .select(
      `
      *,
      timetable_division(division_id),
      timetable_day_template(*)
      `
    )
    .order("created_at", { ascending: false });
  if (activeBranch) timetablesQuery = timetablesQuery.eq("branch_id", activeBranch.id);
  const { data: timetables } = await timetablesQuery;

  // Fetch active school year for the active branch
  let schoolYearsQuery = admin.from("school_year").select("*").eq("is_active", true).order("name");
  if (activeBranch) schoolYearsQuery = schoolYearsQuery.eq("branch_id", activeBranch.id);
  const { data: school_years } = await schoolYearsQuery;

  // Fetch standards and divisions for the active branch
  let standardsQuery = admin.from("standard").select("*").order("grade");
  let divisionsQuery = admin.from("division").select("*").order("standard_id, name");
  if (activeBranch) {
    standardsQuery = standardsQuery.eq("branch_id", activeBranch.id);
    divisionsQuery = divisionsQuery.eq("branch_id", activeBranch.id);
  }
  const { data: standards } = await standardsQuery;
  const { data: divisions } = await divisionsQuery;

  // Subjects are branch-agnostic
  const { data: subjects } = await admin
    .from("subject")
    .select("*")
    .order("name");

  // Fetch teachers (role = teacher) for the active branch
  let teachersQuery = admin
    .from("teacher")
    .select("*")
    .eq("role", "teacher")
    .eq("is_active", true)
    .order("name");
  if (activeBranch) teachersQuery = teachersQuery.eq("branch_id", activeBranch.id);
  const { data: teachers } = await teachersQuery;

  // Fetch time templates with their slots, for the active branch
  let timeTemplatesQuery = admin
    .from("time_template")
    .select(
      `
      *,
      template_slot(*)
      `
    )
    .order("name");
  if (activeBranch) timeTemplatesQuery = timeTemplatesQuery.eq("branch_id", activeBranch.id);
  const { data: time_templates_raw } = await timeTemplatesQuery;

  const time_templates = time_templates_raw as any;

  const activeSchoolYear = school_years?.[0] ?? null;

  let teacher_assignments = [];
  if (activeSchoolYear) {
    let assignmentsQuery = admin
      .from("teacher_assignment")
      .select("*")
      .eq("school_year_id", activeSchoolYear.id);
    if (activeBranch) assignmentsQuery = assignmentsQuery.eq("branch_id", activeBranch.id);
    const { data: assignments } = await assignmentsQuery;
    teacher_assignments = assignments ?? [];
  }

  // Fetch branches (for the branch picker inside the panel)
  const { data: branches } = await admin
    .from("branch")
    .select("*")
    .eq("is_active", true)
    .order("name");

  // Fetch timetable slots for the active branch's active school year
  let timetable_slots = [];
  if (activeSchoolYear) {
    let slotsQuery = admin
      .from("timetable_slot")
      .select("*")
      .eq("school_year_id", activeSchoolYear.id);
    if (activeBranch) slotsQuery = slotsQuery.eq("branch_id", activeBranch.id);
    const { data: slots } = await slotsQuery;
    timetable_slots = slots ?? [];
  }

  return (
    <TimetableShell
      timetables={(timetables ?? []) as any}
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
      activeBranchId={activeBranch?.id ?? null}
    />
  );
}
