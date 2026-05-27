import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { TeachersTab } from "@/components/setup/teachers-tab";

export default async function TeachersPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const db = await createServerClient();

  const { data: teachers } = await db.from("teacher").select("*").eq("role", "teacher").order("name");

  return <TeachersTab teachers={teachers ?? []} />;
}
