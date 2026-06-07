import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { StandardsTab } from "@/components/setup/standards-tab";

export default async function StandardsPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const admin = createAdminClient();

  const [{ data: standards }, { data: divisions }] = await Promise.all([
    admin.from("standard").select("*").order("grade"),
    admin.from("division").select("*").order("name"),
  ]);

  return (
    <StandardsTab
      standards={standards ?? []}
      divisions={divisions ?? []}
    />
  );
}
