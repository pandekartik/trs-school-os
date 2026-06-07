import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { ChaptersTab } from "@/components/setup/chapters-tab";

export default async function ChaptersPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const db = await createServerClient();

  const [
    { data: schoolYears },
    { data: segments },
    { data: standards },
    { data: subjects },
    { data: chapters },
  ] = await Promise.all([
    db.from("school_year").select("id, display_id, name, start_date, end_date, is_active, created_at").order("created_at", { ascending: false }),
    db.from("academic_segment").select("id, display_id, school_year_id, standard_id, name, segment_type, sequence_number, start_date, end_date, created_at").order("sequence_number"),
    db.from("standard").select("id, display_id, name, grade").order("grade"),
    db.from("subject").select("id, display_id, standard_id, name, type, periods_per_week, has_chapters").order("name"),
    db.from("chapter").select("id, display_id, subject_id, academic_segment_id, chapter_number, name, allocated_periods, effective_periods, comments, display_order, status, created_at").order("display_order"),
  ]);

  return (
    <ChaptersTab
      chapters={chapters ?? []}
      segments={segments ?? []}
      standards={standards ?? []}
      subjects={subjects ?? []}
      schoolYears={schoolYears ?? []}
    />
  );
}
