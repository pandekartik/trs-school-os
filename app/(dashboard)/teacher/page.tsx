import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { getRole, getTeacherProfile } from "@/lib/auth";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { getTodayIsoDate } from "@/lib/timetable-constants";

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getWeekRange(weekStart: Date) {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 4);
  return { start, end };
}

async function fetchTeacherSchedule(teacherId: string, weekStart: Date) {
  const admin = createAdminClient();
  const { start, end } = getWeekRange(weekStart);

  const startIso = start.toISOString().split("T")[0];
  const endIso = end.toISOString().split("T")[0];

  const [
    { data: periodInstances },
    { data: timetableSlots },
    { data: chapters },
    { data: chapterPeriods },
    { data: subjects },
    { data: standards },
    { data: divisions },
    { data: teachers },
    { data: absences },
  ] = await Promise.all([
    admin
      .from("period_instance")
      .select("*")
      .eq("teacher_id", teacherId)
      .gte("date", startIso)
      .lte("date", endIso)
      .order("date", { ascending: true }),
    admin
      .from("timetable_slot")
      .select("*")
      .eq("teacher_id", teacherId)
      .is("effective_to", null),
    admin.from("chapter").select("*"),
    admin.from("chapter_period").select("*"),
    admin.from("subject").select("*"),
    admin.from("standard").select("*"),
    admin.from("division").select("*"),
    admin.from("teacher").select("*"),
    admin.from("teacher_absence").select("*").eq("teacher_id", teacherId),
  ]);

  return {
    periodInstances: periodInstances || [],
    timetableSlots: timetableSlots || [],
    chapters: chapters || [],
    chapterPeriods: chapterPeriods || [],
    subjects: subjects || [],
    standards: standards || [],
    divisions: divisions || [],
    teachers: teachers || [],
    absences: absences || [],
  };
}

export default async function TeacherPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const role = await getRole();
  if (!role) redirect("/sign-in");

  const profile = await getTeacherProfile();
  if (!profile) redirect("/sign-in");

  const params = await searchParams;
  let teacherId = profile.id;

  if (role === "teacher") {
    // Teacher can only see their own schedule
    teacherId = profile.id;
  } else if (role === "admin" || role === "coordinator") {
    // Admin/Coordinator can view any teacher
    if (params.teacher) {
      teacherId = String(params.teacher);
    } else {
      // Default to first teacher
      const admin = createAdminClient();
      const { data: teachers } = await admin
        .from("teacher")
        .select("id")
        .limit(1);
      if (teachers?.[0]) {
        teacherId = teachers[0].id;
      }
    }
  }

  // Parse week parameter or use current week
  const today = new Date(getTodayIsoDate());
  let weekStart = getMondayOfWeek(today);

  if (params.week) {
    const weekDate = new Date(String(params.week));
    if (!isNaN(weekDate.getTime())) {
      weekStart = getMondayOfWeek(weekDate);
    }
  }

  const data = await fetchTeacherSchedule(
    teacherId,
    weekStart
  );

  return (
    <TeacherShell
      role={role}
      currentTeacherId={teacherId}
      currentUserProfile={profile}
      weekStart={weekStart}
      data={data}
    />
  );
}
