import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { TeachersShell } from "@/components/setup/teachers-shell";

export default async function TeachersPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const admin = createAdminClient();

  // Fetch all teachers
  const { data: teachers } = await admin
    .from("teacher")
    .select("*")
    .eq("role", "teacher")
    .order("name");

  // Get active school year for password generation
  const { data: activeSchoolYear } = await admin
    .from("school_year")
    .select("name")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return <TeachersShell teachers={teachers ?? []} role={role} activeSchoolYear={activeSchoolYear?.name ?? null} />;
}
