import { getRole, getActiveBranch } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { ContentShell } from "@/components/content/content-shell";
import { redirect } from "next/navigation";

type CountRow = { chapter_id: string; uploaded_count: number; published_count: number };

export default async function ContentPage() {
  const role = await getRole();
  if (!["super_admin", "admin", "coordinator"].includes(role ?? "")) {
    redirect("/teacher");
  }

  const db = await createServerClient();
  const activeBranch = await getActiveBranch();

  // The page is driven by the most recently created active school year
  // for the current branch (school years are branch-scoped).
  let schoolYearsQuery = db.from("school_year").select("*").eq("is_active", true).order("created_at", { ascending: false });
  if (activeBranch) schoolYearsQuery = schoolYearsQuery.eq("branch_id", activeBranch.id);
  const { data: schoolYears } = await schoolYearsQuery;

  const activeYear = schoolYears?.[0] ?? null;

  if (!activeYear) {
    return (
      <ContentShell
        schoolYears={schoolYears ?? []}
        segments={[]}
        standards={[]}
        subjects={[]}
        chapters={[]}
        counts={{}}
      />
    );
  }

  // Segments/standards are branch-scoped; subjects and chapters (content)
  // are shared across branches.
  let standardsQuery = db.from("standard").select("*").is("deleted_at", null).order("grade");
  if (activeBranch) standardsQuery = standardsQuery.eq("branch_id", activeBranch.id);

  const [{ data: segments }, { data: standards }, { data: subjects }] = await Promise.all([
    db
      .from("academic_segment")
      .select("*")
      .eq("school_year_id", activeYear.id)
      .is("deleted_at", null)
      .order("sequence_number"),
    standardsQuery,
    db.from("subject").select("*").eq("has_chapters", true).is("deleted_at", null).order("name"),
  ]);

  const segmentIds = (segments ?? []).map((segment) => segment.id);

  // Chapters for the active year only (no per-period data here anymore).
  let chapters: any[] = [];
  if (segmentIds.length > 0) {
    const { data: chapterData, error } = await db
      .from("chapter")
      .select("*")
      .in("academic_segment_id", segmentIds)
      .is("deleted_at", null)
      .order("display_order");
    if (error) throw error;
    chapters = chapterData ?? [];
  }

  // One row per chapter — uploaded/published counts for the list, via aggregate.
  const { data: countRows, error: countError } = await db.rpc("get_chapter_period_counts", {
    p_school_year_id: activeYear.id,
  });
  if (countError) throw countError;

  const counts: Record<string, { uploaded: number; published: number }> = {};
  for (const row of (countRows as CountRow[] | null) ?? []) {
    counts[row.chapter_id] = { uploaded: row.uploaded_count, published: row.published_count };
  }

  return (
    <ContentShell
      schoolYears={schoolYears ?? []}
      segments={segments ?? []}
      standards={standards ?? []}
      subjects={subjects ?? []}
      chapters={chapters}
      counts={counts}
    />
  );
}
