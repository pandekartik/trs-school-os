import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { TimeTemplatesShell } from "@/components/timetable/time-templates-shell";

export default async function TimeTemplatesPage() {
  const role = await getRole();
  if (role !== "admin") redirect(role === "coordinator" ? "/content" : "/teacher");

  const db = await createServerClient();

  const { data: templates } = await db
    .from("time_template")
    .select("*, template_slot(*)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return <TimeTemplatesShell templates={templates ?? []} />;
}
