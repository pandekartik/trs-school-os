import { redirect } from "next/navigation";
import { getLandingRoute, getRole } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { TimetableShell } from "@/components/timetable/timetable-shell";

export default async function TimetablePage() {
  const role = await getRole();
  if (role !== "admin") redirect(role ? getLandingRoute(role) : "/sign-in");

  const db = await createServerClient();

  const { data: activeSchoolYears } = await db
    .from("school_year")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const activeSchoolYear = activeSchoolYears?.[0] ?? null;

  const [
    { data: standards },
    { data: divisions },
    { data: subjects },
    { data: teachers },
    { data: teacherAssignments },
    { data: timetableSlots },
    { data: holidays },
    { data: segments },
    { data: chapters },
  ] = await Promise.all([
    db.from("standard").select("*").order("grade"),
    db.from("division").select("*").order("name"),
    db.from("subject").select("*").order("name"),
    db.from("teacher").select("*").order("name"),
    activeSchoolYear
      ? db.from("teacher_assignment").select("*").eq("school_year_id", activeSchoolYear.id)
      : Promise.resolve({ data: [] as any[] }),
    activeSchoolYear
      ? db.from("timetable_slot").select("*").eq("school_year_id", activeSchoolYear.id).is("effective_to", null).order("day_of_week").order("period_number")
      : Promise.resolve({ data: [] as any[] }),
    activeSchoolYear
      ? db.from("holiday").select("*").eq("school_year_id", activeSchoolYear.id).order("date")
      : Promise.resolve({ data: [] as any[] }),
    activeSchoolYear
      ? db.from("academic_segment").select("*").eq("school_year_id", activeSchoolYear.id).order("sequence_number")
      : Promise.resolve({ data: [] as any[] }),
    db.from("chapter").select("*").order("display_order"),
  ]);

  return (
    <TimetableShell
      schoolYears={activeSchoolYears ?? []}
      standards={standards ?? []}
      divisions={divisions ?? []}
      subjects={subjects ?? []}
      teachers={teachers ?? []}
      teacherAssignments={teacherAssignments ?? []}
      timetableSlots={timetableSlots ?? []}
      holidays={holidays ?? []}
      segments={segments ?? []}
      chapters={chapters ?? []}
    />
  );
}
