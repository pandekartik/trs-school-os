import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { BranchesShell } from "@/components/setup/branches-shell";

export default async function BranchesPage() {
  const role = await getRole();
  if (role !== "super_admin") redirect("/admin");

  const db = await createServerClient();

  const { data: branches } = await db
    .from("branch")
    .select("id, display_id, name, city, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });

  return <BranchesShell branches={branches ?? []} />;
}
