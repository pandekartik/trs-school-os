import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { BranchesShell } from "@/components/setup/branches-shell";

export default async function BranchesPage() {
  const role = await getRole();
  if (role !== "super_admin") redirect("/admin");

  const admin = createAdminClient();

  const { data: branches } = await admin
    .from("branch")
    .select("id, display_id, name, city, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });

  return <BranchesShell branches={branches ?? []} />;
}
