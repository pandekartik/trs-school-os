import { getRole, getActiveBranch } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { TeachersShell } from "@/components/setup/teachers-shell";
import type { Branch } from "@/lib/types";

export default async function TeachersPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const db = await createServerClient();
  const admin = createAdminClient();
  const branchId = await getActiveBranch();

  // Use admin client to ensure we get all fields including display_id
  let query = admin.from("teacher").select("*").eq("role", "teacher");
  if (branchId) {
    query = query.eq("branch_id", branchId);
  }
  const { data: teachers } = await query.order("name");

  let branches: Branch[] = [];
  if (role === "super_admin") {
    const { data } = await admin.from("branch").select("id, display_id, name, city, is_active, created_at, updated_at").eq("is_active", true).order("name");
    branches = data ?? [];
  }

  // Get active school year for password generation
  const { data: activeSchoolYear } = await admin
    .from("school_year")
    .select("name")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return <TeachersShell teachers={teachers ?? []} branches={branches} role={role} showBranchColumn={!branchId && role === "super_admin"} activeSchoolYear={activeSchoolYear?.name ?? null} />;
}
