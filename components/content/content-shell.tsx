"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  AcademicSegment,
  Chapter,
  ChapterMcq,
  ChapterPeriod,
  ChapterTest,
  SchoolYear,
  Standard,
  Subject,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen } from "lucide-react";
import { ChapterStatusRow } from "@/components/content/chapter-status-row";
import { UploadPanel } from "@/components/content/upload-panel";

type StatusFilter = "all" | "not_started" | "in_progress" | "complete";
type ChapterStatus = "not_started" | "in_progress" | "complete";

type ContentShellProps = {
  schoolYears: SchoolYear[];
  segments: AcademicSegment[];
  standards: Standard[];
  subjects: Subject[];
  chapters: Chapter[];
  chapterPeriods: ChapterPeriod[];
  mcqs: ChapterMcq[];
  tests: ChapterTest[];
};

type ChapterMeta = {
  chapter: Chapter;
  subject: Subject | null;
  segment: AcademicSegment | null;
  uploadedCount: number;
  publishedCount: number;
  status: ChapterStatus;
};

function computeStatus(chapter: Chapter, uploadedCount: number, publishedCount: number): ChapterStatus {
  if (uploadedCount === 0) return "not_started";
  if (uploadedCount >= chapter.allocated_periods && publishedCount >= chapter.allocated_periods) {
    return "complete";
  }
  return "in_progress";
}

export function ContentShell({
  schoolYears,
  segments,
  standards,
  subjects,
  chapters,
  chapterPeriods,
  mcqs,
  tests,
}: ContentShellProps) {
  const activeYear = schoolYears[0] ?? null;

  const [selectedStandardId, setSelectedStandardId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  const standardById = useMemo(
    () => new Map(standards.map((standard) => [standard.id, standard])),
    [standards]
  );
  const subjectById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject])),
    [subjects]
  );
  const segmentById = useMemo(
    () => new Map(segments.map((segment) => [segment.id, segment])),
    [segments]
  );

  const activeSegments = useMemo(
    () => (activeYear
      ? segments.filter((segment) => segment.school_year_id === activeYear.id)
      : []),
    [activeYear, segments]
  );

  const activeSegmentIds = useMemo(
    () => new Set(activeSegments.map((segment) => segment.id)),
    [activeSegments]
  );

  const subjectOptions = useMemo(
    () => subjects
      .filter((subject) => subject.has_chapters)
      .filter((subject) => !selectedStandardId || subject.standard_id === selectedStandardId)
      .sort((a, b) => {
        const gradeA = standardById.get(a.standard_id)?.grade ?? 0;
        const gradeB = standardById.get(b.standard_id)?.grade ?? 0;
        if (gradeA !== gradeB) return gradeA - gradeB;
        return a.name.localeCompare(b.name);
      }),
    [selectedStandardId, standardById, subjects]
  );

  const chapterMeta = useMemo<ChapterMeta[]>(() => {
    const periodGroups = new Map<string, ChapterPeriod[]>();
    for (const period of chapterPeriods) {
      const existing = periodGroups.get(period.chapter_id) ?? [];
      existing.push(period);
      periodGroups.set(period.chapter_id, existing);
    }

    return chapters
      .filter((chapter) => activeSegmentIds.has(chapter.academic_segment_id))
      .map((chapter) => {
        const subject = subjectById.get(chapter.subject_id) ?? null;
        const segment = segmentById.get(chapter.academic_segment_id) ?? null;
        const periods = periodGroups.get(chapter.id) ?? [];
        const uploadedCount = periods.filter((period) => Boolean(period.lesson_plan_url)).length;
        const publishedCount = periods.filter(
          (period) => Boolean(period.lesson_plan_url) && period.is_published
        ).length;

        return {
          chapter,
          subject,
          segment,
          uploadedCount,
          publishedCount,
          status: computeStatus(chapter, uploadedCount, publishedCount),
        };
      })
      .filter((item) => {
        if (selectedStandardId && item.subject?.standard_id !== selectedStandardId) return false;
        if (selectedSubjectId && item.chapter.subject_id !== selectedSubjectId) return false;
        if (statusFilter !== "all" && item.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const gradeA = a.subject ? standardById.get(a.subject.standard_id)?.grade ?? 0 : 0;
        const gradeB = b.subject ? standardById.get(b.subject.standard_id)?.grade ?? 0 : 0;
        if (gradeA !== gradeB) return gradeA - gradeB;
        const subjectCmp = (a.subject?.name ?? "").localeCompare(b.subject?.name ?? "");
        if (subjectCmp !== 0) return subjectCmp;
        const segmentOrderA = a.segment?.sequence_number ?? 0;
        const segmentOrderB = b.segment?.sequence_number ?? 0;
        if (segmentOrderA !== segmentOrderB) return segmentOrderA - segmentOrderB;
        return a.chapter.chapter_number - b.chapter.chapter_number;
      });
  }, [
    activeSegmentIds,
    chapterPeriods,
    chapters,
    selectedStandardId,
    selectedSubjectId,
    segmentById,
    statusFilter,
    standardById,
    subjectById,
  ]);

  const groupedChapters = useMemo(() => {
    const groups = new Map<string, { subject: Subject | null; segment: AcademicSegment | null; items: ChapterMeta[] }>();

    for (const item of chapterMeta) {
      const key = `${item.chapter.subject_id}:${item.chapter.academic_segment_id}`;
      const existing = groups.get(key);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.set(key, {
          subject: item.subject,
          segment: item.segment,
          items: [item],
        });
      }
    }

    return [...groups.entries()]
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => {
        const gradeA = a.subject ? standardById.get(a.subject.standard_id)?.grade ?? 0 : 0;
        const gradeB = b.subject ? standardById.get(b.subject.standard_id)?.grade ?? 0 : 0;
        if (gradeA !== gradeB) return gradeA - gradeB;
        const subjectCmp = (a.subject?.name ?? "").localeCompare(b.subject?.name ?? "");
        if (subjectCmp !== 0) return subjectCmp;
        return (a.segment?.sequence_number ?? 0) - (b.segment?.sequence_number ?? 0);
      });
  }, [chapterMeta, standardById]);

  const selectedChapter = chapterMeta.find((item) => item.chapter.id === selectedChapterId) ?? null;
  const selectedChapterPeriods = useMemo(
    () => selectedChapter
      ? chapterPeriods
        .filter((period) => period.chapter_id === selectedChapter.chapter.id)
        .sort((a, b) => a.period_number - b.period_number)
      : [],
    [chapterPeriods, selectedChapter]
  );
  const selectedMcq = useMemo(
    () => selectedChapter ? mcqs.find((item) => item.chapter_id === selectedChapter.chapter.id) ?? null : null,
    [mcqs, selectedChapter]
  );
  const selectedTest = useMemo(
    () => selectedChapter ? tests.find((item) => item.chapter_id === selectedChapter.chapter.id) ?? null : null,
    [selectedChapter, tests]
  );

  const completeCount = chapterMeta.filter((item) => item.status === "complete").length;
  const pendingCount = chapterMeta.length - completeCount;

  useEffect(() => {
    if (selectedChapterId && !chapterMeta.some((item) => item.chapter.id === selectedChapterId)) {
      setSelectedChapterId(null);
    }
  }, [chapterMeta, selectedChapterId]);

  function handleStandardSelect(value: string) {
    setSelectedStandardId(value === "all" ? null : value);
    setSelectedSubjectId(null);
    setSelectedChapterId(null);
  }

  function handleSubjectSelect(value: string) {
    setSelectedSubjectId(value === "all" ? null : value);
    setSelectedChapterId(null);
  }

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      <Card className="flex w-[420px] shrink-0 flex-col overflow-hidden">
        <div className="border-b px-4 py-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold">Content</h1>
                <p className="text-sm text-muted-foreground">
                  Coordinator-first upload and status tracking
                </p>
              </div>
              {activeYear && (
                <Badge variant="outline" className="font-normal">
                  {activeYear.name}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleStandardSelect("all")}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedStandardId === null
                    ? "border-[#ba2032] bg-[#ba2032] text-white"
                    : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                ].join(" ")}
              >
                All
              </button>
              {standards.map((standard) => {
                const selected = selectedStandardId === standard.id;
                return (
                  <button
                    key={standard.id}
                    type="button"
                    onClick={() => handleStandardSelect(standard.id)}
                    className={[
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      selected
                        ? "border-[#ba2032] bg-[#ba2032] text-white"
                        : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                    ].join(" ")}
                  >
                    {standard.name}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <Select value={selectedSubjectId ?? "all"} onValueChange={handleSubjectSelect}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjectOptions.map((subject) => {
                    const standard = standardById.get(subject.standard_id);
                    return (
                      <SelectItem key={subject.id} value={subject.id}>
                        {standard ? `${standard.name} · ${subject.name}` : subject.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Status
              </span>

              <div className="flex justify-end gap-1">
                {([
                  ["all", "All"],
                  ["not_started", "Pending"],
                  ["in_progress", "In Progress"],
                  ["complete", "Complete"],
                ] as const).map(([value, label]) => {
                  const selected = statusFilter === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatusFilter(value)}
                      className={[
                        "rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors",
                        selected
                          ? "border-[#ba2032] bg-[#ba2032] text-white"
                          : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border bg-secondary/20 px-3 py-2 text-xs text-muted-foreground">
              {chapterMeta.length} chapters total · {completeCount} complete · {pendingCount} pending
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {groupedChapters.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed bg-secondary/20 px-6 py-12 text-center text-xs text-muted-foreground">
              No chapters found matching filters
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {groupedChapters.map((group) => (
                <div key={group.key} className="flex flex-col gap-2">
                  <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className="text-foreground">{group.subject?.name ?? "Unknown subject"}</span>
                    <span className="mx-1 text-muted-foreground">·</span>
                    <span>{group.segment?.name ?? "Unknown segment"}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {group.items.map((item) => (
                      <ChapterStatusRow
                        key={item.chapter.id}
                        chapter={item.chapter}
                        status={item.status}
                        uploadedCount={item.uploadedCount}
                        publishedCount={item.publishedCount}
                        selected={item.chapter.id === selectedChapterId}
                        onSelect={() => setSelectedChapterId(item.chapter.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="min-w-0 flex-1">
        {selectedChapter ? (
          <UploadPanel
            key={selectedChapter.chapter.id}
            chapter={selectedChapter.chapter}
            periods={selectedChapterPeriods}
            mcq={selectedMcq}
            test={selectedTest}
            subjects={subjects}
            segments={segments}
          />
        ) : (
          <Card className="flex h-full min-h-[640px] items-center justify-center overflow-hidden rounded-2xl border bg-card">
            <div className="max-w-sm text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fce8ea] text-[#ba2032]">
                <BookOpen className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-semibold">Select a chapter</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Pick a chapter from the left to upload lesson plans, save MCQs, and manage the chapter test.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
