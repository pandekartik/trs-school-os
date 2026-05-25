import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { SchoolYearTab } from "@/components/setup/school-year-tab";

export default async function SchoolYearPage() {
  const role = await getRole();
  if (role !== "admin") redirect(role === "coordinator" ? "/content" : "/teacher");

  const db = await createServerClient();

  const { data: schoolYears } = await db
    .from("school_year")
    .select("*")
    .order("created_at", { ascending: false });

  return <SchoolYearTab schoolYears={schoolYears ?? []} />;
}
