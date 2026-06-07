import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { AssignmentsTab } from "@/components/setup/assignments-tab";

export default async function TeacherAllocationPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const db = await createServerClient();

  let teacherQuery = db.from("teacher").select("*").eq("role", "teacher");
  if (branchId) {
    teacherQuery = teacherQuery.eq("branch_id", branchId);
  }

  const [
    { data: schoolYears },
    { data: standards },
    { data: divisions },
    { data: subjects },
    { data: teachers },
    { data: assignments },
  ] = await Promise.all([
    db.from("school_year").select("*").order("created_at", { ascending: false }),
    db.from("standard").select("*").order("grade"),
    db.from("division").select("*").order("name"),
    db.from("subject").select("*").order("name"),
    teacherQuery.order("name"),
    db.from("teacher_assignment").select("*"),
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
