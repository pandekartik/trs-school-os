import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { getRole } from "@/lib/auth";
import type { UserRole } from "@/lib/role-access";
import { getTodayIsoDate } from "@/lib/timetable-constants";
import { DashboardShell } from "@/components/admin/dashboard-shell";
import { flagUnloggedPeriods } from "@/lib/actions/admin";

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export default async function AdminPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) {
    const fallback = role === "coordinator" ? "/content" : "/teacher";
    redirect(fallback);
  }

  // Flag unlogged periods first
  await flagUnloggedPeriods();

  const admin = createAdminClient();
  const today = getTodayIsoDate();
  const weekStart = getMondayOfWeek(new Date(today));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 4);

  const weekStartIso = weekStart.toISOString().split("T")[0];
  const weekEndIso = weekEnd.toISOString().split("T")[0];

  // Refresh coverage summary
  await admin.rpc("refresh_coverage_summary", {
    p_week_start: weekStartIso,
  });

  // Build conditional queries for branch filtering
  const teacherQuery = admin.from("teacher").select("*").eq("is_active", true);

  const absenceQuery = admin
    .from("teacher_absence")
    .select("*")
    .gte("absence_date", weekStartIso)
    .lte("absence_date", weekEndIso);

  const holidayQuery = admin
    .from("holiday")
    .select("*")
    .gte("date", weekStartIso)
    .lte("date", weekEndIso);

  // Fetch all data in parallel
  const [
    { data: activeSchoolYears },
    { data: teachers },
    { data: standards },
    { data: divisions },
    { data: subjects },
    { data: periodInstancesToday },
    { data: periodInstancesThisWeek },
    { data: unloggedPeriods },
    { data: coverageSummaryThisWeek },
    { data: chapters },
    { data: academicSegments },
    { data: absencesThisWeek },
    { data: holidaysThisWeek },
  ] = await Promise.all([
    admin.from("school_year").select("*").eq("is_active", true),
    teacherQuery.order("name"),
    admin.from("standard").select("*").order("grade"),
    admin.from("division").select("*").order("name"),
    admin.from("subject").select("*").order("name"),
    admin
      .from("period_instance")
      .select("*")
      .eq("date", today)
      .eq("is_buffer", false)
      .neq("status", "cancelled"),
    admin
      .from("period_instance")
      .select("*")
      .gte("date", weekStartIso)
      .lte("date", weekEndIso)
      .eq("is_buffer", false),
    admin
      .from("period_instance")
      .select("*")
      .eq("status", "unlogged")
      .order("date", { ascending: false })
      .limit(20),
    admin
      .from("coverage_summary")
      .select("*")
      .eq("week_start", weekStartIso),
    admin.from("chapter").select("*").order("display_order"),
    admin.from("academic_segment").select("*"),
    absenceQuery,
    holidayQuery,
  ]);

  return (
    <DashboardShell
      role={role as UserRole}
      activeSchoolYear={activeSchoolYears?.[0] ?? null}
      teachers={teachers ?? []}
      standards={standards ?? []}
      divisions={divisions ?? []}
      subjects={subjects ?? []}
      periodInstancesToday={periodInstancesToday ?? []}
      periodInstancesThisWeek={periodInstancesThisWeek ?? []}
      unloggedPeriods={unloggedPeriods ?? []}
      coverageSummaryThisWeek={coverageSummaryThisWeek ?? []}
      chapters={chapters ?? []}
      academicSegments={academicSegments ?? []}
      absencesThisWeek={absencesThisWeek ?? []}
      holidaysThisWeek={holidaysThisWeek ?? []}
      weekStart={weekStart}
      today={new Date(today)}
    />
  );
}
