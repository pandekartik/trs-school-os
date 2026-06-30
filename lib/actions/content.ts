"use server";

import { createServerClient } from "@/lib/supabase-server";
import type { ChapterMcq, ChapterPeriod, ChapterTest } from "@/lib/types";

export type ChapterContent = {
  periods: ChapterPeriod[];
  mcq: ChapterMcq | null;
  test: ChapterTest | null;
  error?: string;
};

/**
 * Fetch the lesson plans, MCQ set and test for a single chapter.
 * Loaded on demand when a chapter is selected in /content, so the page no
 * longer has to pull every chapter_period row up front.
 */
export async function getChapterContent(chapterId: string): Promise<ChapterContent> {
  const db = await createServerClient();

  const [periodsRes, mcqRes, testRes] = await Promise.all([
    db
      .from("chapter_period")
      .select("*")
      .eq("chapter_id", chapterId)
      .is("deleted_at", null)
      .order("period_number"),
    // chapter_mcq / chapter_test have no soft-delete column.
    db.from("chapter_mcq").select("*").eq("chapter_id", chapterId).limit(1).maybeSingle(),
    db.from("chapter_test").select("*").eq("chapter_id", chapterId).limit(1).maybeSingle(),
  ]);

  if (periodsRes.error) {
    return { periods: [], mcq: null, test: null, error: periodsRes.error.message };
  }

  return {
    periods: (periodsRes.data as ChapterPeriod[]) ?? [],
    mcq: (mcqRes.data as ChapterMcq | null) ?? null,
    test: (testRes.data as ChapterTest | null) ?? null,
  };
}
