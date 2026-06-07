import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { SubjectsTab } from "@/components/setup/subjects-tab";

export default async function SubjectsPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const admin = createAdminClient();

  const [{ data: subjects }, { data: standards }] = await Promise.all([
    admin.from("subject").select("*").order("name"),
    admin.from("standard").select("*").order("grade"),
  ]);

  return (
    <SubjectsTab
      subjects={subjects ?? []}
      standards={standards ?? []}
    />
  );
}
