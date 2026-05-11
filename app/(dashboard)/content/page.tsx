import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { ContentDrilldown } from "@/components/content/content-drilldown";

export default async function ContentPage() {
  const role = await getRole();
  if (role !== "admin") redirect("/admin");

  const db = await createServerClient();

  const [
    { data: schoolYears },
    { data: segments },
    { data: standards },
    { data: subjects },
    { data: chapters },
    { data: chapterPeriods },
    { data: mcqs },
    { data: tests },
  ] = await Promise.all([
    db.from("school_year").select("*").order("created_at", { ascending: false }),
    db.from("academic_segment").select("*").order("sequence_number"),
    db.from("standard").select("*").order("grade"),
    db.from("subject").select("*").eq("has_chapters", true).order("name"),
    db.from("chapter").select("*").order("display_order"),
    db.from("chapter_period").select("*").order("period_number"),
    db.from("chapter_mcq").select("*"),
    db.from("chapter_test").select("*"),
  ]);

  return (
    <ContentDrilldown
      schoolYears={schoolYears ?? []}
      segments={segments ?? []}
      standards={standards ?? []}
      subjects={subjects ?? []}
      chapters={chapters ?? []}
      chapterPeriods={chapterPeriods ?? []}
      mcqs={mcqs ?? []}
      tests={tests ?? []}
    />
  );
}
