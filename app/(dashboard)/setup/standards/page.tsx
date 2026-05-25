import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { StandardsTab } from "@/components/setup/standards-tab";

export default async function StandardsPage() {
  const role = await getRole();
  if (role !== "admin") redirect(role === "coordinator" ? "/content" : "/teacher");

  const db = await createServerClient();

  const [{ data: standards }, { data: divisions }] = await Promise.all([
    db.from("standard").select("*").order("grade"),
    db.from("division").select("*").order("name"),
  ]);

  return (
    <StandardsTab
      standards={standards ?? []}
      divisions={divisions ?? []}
    />
  );
}
