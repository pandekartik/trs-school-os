import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { HolidaysShell } from "@/components/timetable/holidays-shell";

export default async function HolidaysPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const db = await createServerClient();

  // Get active school year
  const { data: activeSchoolYear } = await db
    .from("school_year")
    .select("id, name, start_date, end_date")
    .eq("is_active", true)
    .single();

  if (!activeSchoolYear) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No active school year found</p>
      </div>
    );
  }

  // Get holidays for active school year
  let holidayQuery = db
    .from("holiday")
    .select(
      `
      id,
      school_year_id,
      date,
      name,
      type,
      affects_all,
      division_id
    `
    )
    .eq("school_year_id", activeSchoolYear.id);
  if (branchId) {
    holidayQuery = holidayQuery.eq("branch_id", branchId);
  }
  const { data: holidays } = await holidayQuery.order("date", { ascending: true });

  // Get all standards and divisions for dropdowns
  const { data: standards } = await db
    .from("standard")
    .select("id, name, grade")
    .order("grade", { ascending: true });

  const { data: divisions } = await db
    .from("division")
    .select("id, name, standard_id");

  return (
    <HolidaysShell
      holidays={holidays ?? []}
      standards={standards ?? []}
      divisions={divisions ?? []}
      activeSchoolYear={activeSchoolYear}
    />
  );
}
