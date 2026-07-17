import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { LeavePolicyShell } from "@/components/setup/leave-policy-shell";
import type { LeavePolicy, SchoolYear } from "@/lib/types";

export default async function LeavePolicyPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const admin = createAdminClient();

  const { data: schoolYears } = await admin
    .from("school_year")
    .select("*")
    .order("created_at", { ascending: false });

  const activeYear = ((schoolYears ?? []) as SchoolYear[]).find((y) => y.is_active) ?? null;

  let policies: LeavePolicy[] = [];
  if (activeYear) {
    const { data } = await admin
      .from("leave_policy")
      .select("*")
      .eq("school_year_id", activeYear.id)
      .order("leave_type");
    policies = (data ?? []) as LeavePolicy[];
  }

  return <LeavePolicyShell policies={policies} activeSchoolYear={activeYear} />;
}
