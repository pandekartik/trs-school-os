import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { getRole, getTeacherProfile } from "@/lib/auth";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { getTodayIsoDate } from "@/lib/timetable-constants";
import type { SchoolYear, AcademicSegment, Holiday } from "@/lib/types";

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

async function fetchTeacherSchedule(
  teacherId: string,
  weekStart: Date,
  schoolYearId?: string
) {
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
    { data: holidays },
    { data: academicSegments },
    { data: divisionTemplates },
    { data: timetableActivations },
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
      .eq("teacher_id", teacherId),
    admin.from("chapter").select("*"),
    admin.from("chapter_period").select("*"),
    admin.from("subject").select("*"),
    admin.from("standard").select("*"),
    admin.from("division").select("*"),
    admin.from("teacher").select("*"),
    admin
      .from("teacher_absence")
      .select("*")
      .eq("teacher_id", teacherId)
      .gte("absence_date", startIso)
      .lte("absence_date", endIso),
    schoolYearId
      ? admin
          .from("holiday")
          .select("*")
          .eq("school_year_id", schoolYearId)
          .gte("date", startIso)
          .lte("date", endIso)
      : (async () => ({ data: [] }))(),
    admin.from("academic_segment").select("*"),
    admin.from("division_template").select("*"),
    admin
      .from("timetable_activation")
      .select("*")
      .eq("status", "finalized"),
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
    holidays: holidays || [],
    academicSegments: academicSegments || [],
    divisionTemplates: divisionTemplates || [],
    timetableActivations: timetableActivations || [],
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

  // Parse week parameter or use school year start week
  const today = new Date(getTodayIsoDate());
  let weekStart = getMondayOfWeek(today);

  // Fetch active school year and use its start date if available
  const admin = createAdminClient();
  const { data: schoolYears } = await admin
    .from("school_year")
    .select("*")
    .eq("is_active", true)
    .limit(1);

  let schoolYearId = "";
  if (schoolYears && schoolYears.length > 0) {
    const activeYear = schoolYears[0] as SchoolYear;
    schoolYearId = activeYear.id;
    const yearStartDate = new Date(activeYear.start_date);
    // Use school year start date if it's after today
    if (yearStartDate > today) {
      weekStart = getMondayOfWeek(yearStartDate);
    }
  }

  if (params.week) {
    const weekDate = new Date(String(params.week));
    if (!isNaN(weekDate.getTime())) {
      weekStart = getMondayOfWeek(weekDate);
    }
  }

  const data = await fetchTeacherSchedule(
    teacherId,
    weekStart,
    schoolYearId
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
