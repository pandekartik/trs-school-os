import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { ContentShell } from "@/components/content/content-shell";

export default async function ContentPage() {
  const role = await getRole();
  if (role !== "admin") redirect("/admin");

  const db = createServerClient();

  const [
    { data: schoolYears },
    { data: segments },
    { data: standards },
    { data: subjects },
    { data: chapters },
    { data: chapterPeriods },
    { data: mcqs },
    { data: tests },
    { data: teachers },
  ] = await Promise.all([
    db.from("school_year").select("*").eq("is_active", true).limit(1),
    db.from("academic_segment").select("*").order("sequence_number"),
    db.from("standard").select("*").order("grade"),
    db.from("subject").select("*").eq("has_chapters", true).order("name"),
    db.from("chapter").select("*").order("display_order"),
    db.from("chapter_period").select("*").order("period_number"),
    db.from("chapter_mcq").select("*"),
    db.from("chapter_test").select("*"),
    db.from("teacher").select("*").eq("is_active", true).order("name"),
  ]);

  return (
    <ContentShell
      schoolYear={schoolYears?.[0] ?? null}
      segments={segments ?? []}
      standards={standards ?? []}
      subjects={subjects ?? []}
      chapters={chapters ?? []}
      chapterPeriods={chapterPeriods ?? []}
      mcqs={mcqs ?? []}
      tests={tests ?? []}
      teachers={teachers ?? []}
    />
  );
}