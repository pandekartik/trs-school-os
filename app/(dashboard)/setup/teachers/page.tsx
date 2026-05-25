import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { TeachersTab } from "@/components/setup/teachers-tab";

export default async function TeachersPage() {
  const role = await getRole();
  if (role !== "admin") redirect(role === "coordinator" ? "/content" : "/teacher");

  const db = await createServerClient();

  const { data: teachers } = await db.from("teacher").select("*").order("name");

  return <TeachersTab teachers={teachers ?? []} />;
}
