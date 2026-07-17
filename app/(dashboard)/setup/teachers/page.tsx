import { getRole, getActiveBranch } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { TeachersShell } from "@/components/setup/teachers-shell";

export default async function TeachersPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const admin = createAdminClient();
  const activeBranch = await getActiveBranch();

  // Fetch teachers for the active branch
  let teachersQuery = admin.from("teacher").select("*").eq("role", "teacher").order("name");
  if (activeBranch) teachersQuery = teachersQuery.eq("branch_id", activeBranch.id);
  const { data: teachers } = await teachersQuery;

  // Get active school year for the active branch (for password generation)
  let schoolYearQuery = admin.from("school_year").select("name").eq("is_active", true).limit(1);
  if (activeBranch) schoolYearQuery = schoolYearQuery.eq("branch_id", activeBranch.id);
  const { data: activeSchoolYear } = await schoolYearQuery.maybeSingle();

  return <TeachersShell teachers={teachers ?? []} role={role} activeSchoolYear={activeSchoolYear?.name ?? null} />;
}
