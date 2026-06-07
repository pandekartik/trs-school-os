import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { TimeTemplatesShell } from "@/components/timetable/time-templates-shell";

export default async function TimeTemplatesPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const db = await createServerClient();

  let query = db
    .from("time_template")
    .select("*, template_slot(*)")
    .is("deleted_at", null);
  if (branchId) {
    query = query.eq("branch_id", branchId);
  }
  const { data: templates } = await query.order("created_at", { ascending: false });

  return <TimeTemplatesShell templates={templates ?? []} />;
}
