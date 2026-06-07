import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { SubjectsTab } from "@/components/setup/subjects-tab";

export default async function SubjectsPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const db = await createServerClient();

  const [{ data: subjects }, { data: standards }] = await Promise.all([
    db.from("subject").select("*").order("name"),
    db.from("standard").select("*").order("grade"),
  ]);

  return (
    <SubjectsTab
      subjects={subjects ?? []}
      standards={standards ?? []}
    />
  );
}
