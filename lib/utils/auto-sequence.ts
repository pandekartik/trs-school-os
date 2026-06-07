import type { Chapter, ChapterPeriod } from "@/lib/types";

interface AutoSequenceResult {
  chapter: Chapter;
  periodNumber: number;
  chapterPeriod: ChapterPeriod | null;
}

export function getChapterPeriodForSlot(
  slotDate: string,
  subjectId: string,
  divisionId: string,
  segmentStartDate: string,
  allSlotDates: string[],
  chapters: Chapter[],
  chapterPeriods: ChapterPeriod[],
  cancelledSlotDates: string[] = []
): AutoSequenceResult | null {
  // Filter out cancelled dates when counting occurrences
  const activeDates = allSlotDates.filter((date) => !cancelledSlotDates.includes(date));

  // Find index of slotDate in activeDates (1-based)
  const slotIndex = activeDates.indexOf(slotDate);
  if (slotIndex === -1) return null;
  const N = slotIndex + 1; // 1-based index

  // Filter chapters for this subject, ordered by display_order
  const relevantChapters = chapters
    .filter((ch) => ch.subject_id === subjectId)
    .sort((a, b) => a.display_order - b.display_order);

  if (relevantChapters.length === 0) return null;

  // Walk through chapters to find which chapter and period N maps to
  let accumulatedSlots = 0;

  for (const chapter of relevantChapters) {
    const effectivePeriods = chapter.effective_periods || chapter.allocated_periods;
    const chapterStart = accumulatedSlots + 1;
    const chapterEnd = accumulatedSlots + effectivePeriods;

    if (N >= chapterStart && N <= chapterEnd) {
      // Found the chapter
      const periodNumber = N - accumulatedSlots;

      // Find the corresponding ChapterPeriod
      const chapterPeriod = chapterPeriods.find(
        (cp) => cp.chapter_id === chapter.id && cp.period_number === periodNumber
      ) || null;

      return {
        chapter,
        periodNumber,
        chapterPeriod,
      };
    }

    accumulatedSlots = chapterEnd;
  }

  // N exceeds all chapters
  return null;
}
