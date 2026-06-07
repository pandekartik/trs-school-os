import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { StandardsTab } from "@/components/setup/standards-tab";

export default async function StandardsPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const db = await createServerClient();

  const [{ data: standards }, { data: divisions }] = await Promise.all([
    db.from("standard").select("id, display_id, name, grade").order("grade"),
    db.from("division").select("id, display_id, standard_id, name").order("name"),
  ]);

  return (
    <StandardsTab
      standards={standards ?? []}
      divisions={divisions ?? []}
    />
  );
}
