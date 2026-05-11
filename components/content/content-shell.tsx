"use client";

import { useState } from "react";
import {
  AcademicSegment, Standard, Subject,
  Chapter, ChapterPeriod, ChapterMcq, ChapterTest, Teacher,
} from "@/lib/types";
import { ContentTree } from "./content-tree";
import { ContentEditor } from "./content-editor";

type SchoolYear = { id: string; name: string; start_date: string; end_date: string };

interface ContentShellProps {
  schoolYear: SchoolYear | null;
  segments: AcademicSegment[];
  standards: Standard[];
  subjects: Subject[];
  chapters: Chapter[];
  chapterPeriods: ChapterPeriod[];
  mcqs: ChapterMcq[];
  tests: ChapterTest[];
  teachers: Teacher[];
}

export function ContentShell({
  schoolYear, segments, standards, subjects,
  chapters, chapterPeriods, mcqs, tests, teachers,
}: ContentShellProps) {
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId) ?? null;
  const selectedPeriods = chapterPeriods.filter((cp) => cp.chapter_id === selectedChapterId);
  const selectedMcq     = mcqs.find((m) => m.chapter_id === selectedChapterId) ?? null;
  const selectedTest    = tests.find((t) => t.chapter_id === selectedChapterId) ?? null;

  if (!schoolYear) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-sm font-medium">No active school year</p>
        <p className="text-xs text-muted-foreground">
          Go to Academic Setup and create a school year first.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <h1>Content</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage lesson plans, MCQs and tests · {schoolYear.name}
        </p>
      </div>

      <div className="flex gap-4 flex-1" style={{ minHeight: "calc(100vh - 180px)" }}>
        <div
          className="shrink-0 overflow-y-auto rounded-xl border bg-card"
          style={{ width: "300px" }}
        >
          <ContentTree
            segments={segments}
            standards={standards}
            subjects={subjects}
            chapters={chapters}
            chapterPeriods={chapterPeriods}
            selectedChapterId={selectedChapterId}
            onSelectChapter={setSelectedChapterId}
            schoolYearId={schoolYear.id}
          />
        </div>

        <div className="flex-1 overflow-y-auto rounded-xl border bg-card">
          {selectedChapter ? (
            <ContentEditor
              chapter={selectedChapter}
              periods={selectedPeriods}
              mcq={selectedMcq}
              test={selectedTest}
              segments={segments}
              subjects={subjects}
              teachers={teachers}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-8">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                style={{ background: "var(--color-brand-light)" }}
              >
                <span style={{ color: "var(--color-brand)", fontSize: "18px" }}>↖</span>
              </div>
              <p className="text-sm font-medium">Select a chapter</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Choose a chapter from the tree on the left to manage its periods and content.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}