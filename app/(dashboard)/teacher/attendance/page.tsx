import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { getRole, getTeacherProfile, getActiveBranch } from "@/lib/auth";
import { AttendanceShell } from "@/components/teacher/attendance-shell";
import type { Teacher, TeacherAttendance, TimetableSlot, PeriodOverride } from "@/lib/types";

interface PageProps {
  searchParams: Promise<{
    month?: string;
    year?: string;
    teacher?: string;
  }>;
}

export default async function AttendancePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const role = await getRole();
  const profile = await getTeacherProfile();
  const activeBranch = await getActiveBranch();
  const branchId = activeBranch?.id || "";

  // Get current date for defaults
  const now = new Date();
  const currentMonth = parseInt(params.month ?? String(now.getMonth() + 1), 10);
  const currentYear = parseInt(params.year ?? String(now.getFullYear()), 10);

  const admin = createAdminClient();

  // Determine which teachers to fetch based on role
  let targetTeacherIds: string[] = [];
  if (role === "teacher") {
    if (!profile?.id) redirect("/teacher");
    targetTeacherIds = [profile.id];
  } else if (["admin", "super_admin"].includes(role ?? "")) {
    if (params.teacher) {
      targetTeacherIds = [params.teacher];
    } else {
      // Fetch all teachers in the active branch
      const { data: teachers } = await admin
        .from("teacher")
        .select("id")
        .eq("role", "teacher")
        .eq("is_active", true)
        .eq("branch_id", branchId);
      targetTeacherIds = (teachers ?? []).map((t: any) => t.id);
    }
  } else {
    redirect("/");
  }

  if (targetTeacherIds.length === 0) {
    targetTeacherIds = [profile?.id ?? ""];
  }

  // Calculate first and last day of the month
  const firstDay = new Date(currentYear, currentMonth - 1, 1);
  const lastDay = new Date(currentYear, currentMonth, 0);
  const startDate = firstDay.toISOString().split("T")[0];
  const endDate = lastDay.toISOString().split("T")[0];

  // Fetch all relevant data in parallel, scoped to the active branch
  let teachersQuery = admin
    .from("teacher")
    .select("*")
    .eq("role", "teacher")
    .eq("is_active", true);

  if (branchId) {
    teachersQuery = teachersQuery.eq("branch_id", branchId);
  }

  const [
    { data: attendanceRecords },
    { data: teachers },
    { data: timetableSlots },
    { data: periodOverrides },
  ] = await Promise.all([
    admin
      .from("teacher_attendance")
      .select("*")
      .in("teacher_id", targetTeacherIds)
      .gte("date", startDate)
      .lte("date", endDate),
    teachersQuery,
    admin
      .from("timetable_slot")
      .select("*")
      .in("teacher_id", targetTeacherIds),
    admin
      .from("period_override")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate),
  ]);

  const attendanceMap = new Map<string, TeacherAttendance>();
  (attendanceRecords ?? []).forEach((record: any) => {
    attendanceMap.set(`${record.teacher_id}:${record.date}`, record);
  });

  return (
    <AttendanceShell
      role={role}
      profile={profile}
      currentMonth={currentMonth}
      currentYear={currentYear}
      teachers={teachers ?? []}
      attendance={attendanceRecords ?? []}
      timetableSlots={timetableSlots ?? []}
      periodOverrides={periodOverrides ?? []}
      selectedTeacherId={params.teacher ?? null}
      branchId={branchId ?? ""}
    />
  );
}
