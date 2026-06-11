import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { LeavePolicyShell } from "@/components/setup/leave-policy-shell";
import type { SchoolYear, LeavePolicy } from "@/lib/types";

export default async function LeavePolicyPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const admin = createAdminClient();

  const { data: activeYear } = await admin
    .from("school_year")
    .select("*")
    .eq("is_active", true)
    .single() as { data: SchoolYear | null };

  if (!activeYear) {
    redirect("/setup/school-year");
  }

  const { data: policies } = await admin
    .from("leave_policy")
    .select("*")
    .eq("school_year_id", activeYear.id)
    .order("leave_type") as { data: LeavePolicy[] | null };

  return <LeavePolicyShell policies={policies ?? []} activeYear={activeYear} />;
}
