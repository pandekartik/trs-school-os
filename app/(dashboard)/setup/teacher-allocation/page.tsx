import { getRole, getActiveBranch } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { AssignmentsTab } from "@/components/setup/assignments-tab";

export default async function TeacherAllocationPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const db = await createServerClient();
  const activeBranch = await getActiveBranch();

  let schoolYearsQuery = db.from("school_year").select("*").order("created_at", { ascending: false });
  let standardsQuery = db.from("standard").select("*").order("grade");
  let divisionsQuery = db.from("division").select("*").order("name");
  let teacherQuery = db.from("teacher").select("*").eq("role", "teacher");
  let assignmentsQuery = db.from("teacher_assignment").select("*");
  if (activeBranch) {
    schoolYearsQuery = schoolYearsQuery.eq("branch_id", activeBranch.id);
    standardsQuery = standardsQuery.eq("branch_id", activeBranch.id);
    divisionsQuery = divisionsQuery.eq("branch_id", activeBranch.id);
    teacherQuery = teacherQuery.eq("branch_id", activeBranch.id);
    assignmentsQuery = assignmentsQuery.eq("branch_id", activeBranch.id);
  }

  const [
    { data: schoolYears },
    { data: standards },
    { data: divisions },
    { data: subjects },
    { data: teachers },
    { data: assignments },
  ] = await Promise.all([
    schoolYearsQuery,
    standardsQuery,
    divisionsQuery,
    db.from("subject").select("*").order("name"),
    teacherQuery.order("name"),
    assignmentsQuery,
  ]);

  return (
    <AssignmentsTab
      teachers={teachers ?? []}
      subjects={subjects ?? []}
      divisions={divisions ?? []}
      standards={standards ?? []}
      schoolYears={schoolYears ?? []}
      assignments={assignments ?? []}
    />
  );
}
