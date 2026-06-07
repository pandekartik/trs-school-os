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

  let query = db.from("teacher").select("*").eq("role", "teacher");
  if (branchId) {
    query = query.eq("branch_id", branchId);
  }
  const { data: teachers } = await query.order("name");

  // DEBUG: Log what we received from the database
  console.log("DEBUG: Teachers data from DB:", teachers?.[0] ? Object.keys(teachers[0]) : "No data");
  if (teachers?.[0]) {
    console.log("DEBUG: First teacher:", {
      name: teachers[0].name,
      email: teachers[0].email,
      display_id: teachers[0].display_id,
      hasDisplayId: "display_id" in teachers[0]
    });
  }

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
