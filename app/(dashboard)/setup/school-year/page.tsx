import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { SchoolYearShell } from "@/components/setup/school-year-shell";

export default async function SchoolYearPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const db = await createServerClient();

  const { data: allYears } = await db
    .from("school_year")
    .select("*");

  // Sort: active year first, then by created_at descending
  const schoolYears = (allYears ?? []).sort((a, b) => {
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return <SchoolYearShell schoolYears={schoolYears} />;
}
