import { getRole, getActiveBranch } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { SubjectsTab } from "@/components/setup/subjects-tab";

export default async function SubjectsPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const admin = createAdminClient();
  const activeBranch = await getActiveBranch();

  let standardsQuery = admin.from("standard").select("*").order("grade");
  if (activeBranch) standardsQuery = standardsQuery.eq("branch_id", activeBranch.id);

  const [{ data: subjects }, { data: standards }] = await Promise.all([
    admin.from("subject").select("*").order("name"),
    standardsQuery,
  ]);

  return (
    <SubjectsTab
      subjects={subjects ?? []}
      standards={standards ?? []}
    />
  );
}
