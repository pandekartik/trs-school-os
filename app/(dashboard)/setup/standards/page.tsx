import { getRole, getActiveBranch } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { StandardsTab } from "@/components/setup/standards-tab";

export default async function StandardsPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const admin = createAdminClient();
  const activeBranch = await getActiveBranch();

  let standardsQuery = admin.from("standard").select("*").order("grade");
  let divisionsQuery = admin.from("division").select("*").order("name");
  if (activeBranch) {
    standardsQuery = standardsQuery.eq("branch_id", activeBranch.id);
    divisionsQuery = divisionsQuery.eq("branch_id", activeBranch.id);
  }

  const [{ data: standards }, { data: divisions }] = await Promise.all([
    standardsQuery,
    divisionsQuery,
  ]);

  return (
    <StandardsTab
      standards={standards ?? []}
      divisions={divisions ?? []}
    />
  );
}
