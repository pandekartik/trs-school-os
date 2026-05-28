import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { getRole } from "@/lib/auth";
import { ActivityShell } from "@/components/admin/activity-shell";

export default async function AdminActivityPage() {
  const role = await getRole();
  if (role !== "super_admin") redirect("/admin");

  const admin = createAdminClient();

  const { data: logs } = await admin
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: teachers } = await admin
    .from("teacher")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <ActivityShell
      initialLogs={logs ?? []}
      teachers={teachers ?? []}
    />
  );
}
