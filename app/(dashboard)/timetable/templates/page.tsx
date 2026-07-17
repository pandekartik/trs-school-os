import { getRole, getActiveBranch } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { TimeTemplatesShell } from "@/components/timetable/time-templates-shell";

export default async function TimeTemplatesPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const db = await createServerClient();
  const activeBranch = await getActiveBranch();

  let templatesQuery = db
    .from("time_template")
    .select("*, template_slot(*)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (activeBranch) templatesQuery = templatesQuery.eq("branch_id", activeBranch.id);
  const { data: templates } = await templatesQuery;

  return <TimeTemplatesShell templates={templates ?? []} />;
}
