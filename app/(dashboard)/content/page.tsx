import { getRole } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { ContentShell } from "@/components/content/content-shell";
import { redirect } from "next/navigation";

export default async function ContentPage() {
  const role = await getRole();
  if (!["super_admin", "admin", "coordinator"].includes(role ?? "")) {
    redirect("/teacher");
  }

  const db = await createServerClient();

  async function fetchAll(table: string, orderCol?: string, filterDeleted = false) {
    let allData: any[] = [];
    let from = 0;
    const step = 1000;
    while (true) {
      let query = db.from(table).select("*");
      if (filterDeleted) query = query.is("deleted_at", null);
      if (orderCol) query = query.order(orderCol);
      const { data, error } = await query.range(from, from + step - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allData = allData.concat(data);
      if (data.length < step) break;
      from += step;
    }
    return { data: allData };
  }

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
    db.from("school_year").select("*").eq("is_active", true).order("created_at", { ascending: false }),
    db.from("academic_segment").select("*").order("sequence_number"),
    db.from("standard").select("*").order("grade"),
    db.from("subject").select("*").eq("has_chapters", true).order("name"),
    fetchAll("chapter", "display_order"),
    fetchAll("chapter_period", "period_number", true),
    fetchAll("chapter_mcq"),
    fetchAll("chapter_test"),
  ]);

  return (
    <ContentShell
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
