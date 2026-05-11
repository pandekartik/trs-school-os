"use client";

import { useState } from "react";
import {
  AcademicSegment, Standard, Subject, Chapter, ChapterPeriod,
} from "@/lib/types";
import { createChapter, deleteChapter } from "@/lib/actions/setup";
import { useAction } from "@/lib/hooks/use-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronRight, ChevronDown, BookOpen, FileText,
  Plus, Trash2, CheckCircle2, Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ContentTreeProps {
  segments: AcademicSegment[];
  standards: Standard[];
  subjects: Subject[];
  chapters: Chapter[];
  chapterPeriods: ChapterPeriod[];
  selectedChapterId: string | null;
  onSelectChapter: (id: string) => void;
  schoolYearId: string;
}

export function ContentTree({
  segments, standards, subjects, chapters,
  chapterPeriods, selectedChapterId, onSelectChapter, schoolYearId,
}: ContentTreeProps) {
  const [expandedStandards, setExpandedStandards] = useState<Set<string>>(new Set());
  const [expandedSubjects, setExpandedSubjects]   = useState<Set<string>>(new Set());
  const [expandedSegments, setExpandedSegments]   = useState<Set<string>>(new Set());
  const [addChapterFor, setAddChapterFor]         = useState<{ subjectId: string; segmentId: string } | null>(null);

  const chapterAction = useAction(createChapter, {
    successMessage: "Chapter created",
    onSuccess: () => setAddChapterFor(null),
  });

  function toggle(set: Set<string>, setFn: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setFn(next);
  }

  async function handleDeleteChapter(id: string) {
    const result = await deleteChapter(id);
    if (result?.error) toast.error("Delete failed", { description: result.error });
    else toast.success("Chapter deleted");
  }

  function periodStatus(chapterId: string, chapter: Chapter) {
    const periods = chapterPeriods.filter((p) => p.chapter_id === chapterId);
    const published = periods.filter((p) => p.is_published).length;
    const total = chapter.allocated_periods;
    if (published === total) return "complete";
    if (published > 0) return "partial";
    return "empty";
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Content tree
        </span>
        <span className="text-xs text-muted-foreground">
          {chapters.length} chapters
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {standards.map((standard) => {
          const stdSubjects = subjects.filter((s) => s.standard_id === standard.id);
          if (stdSubjects.length === 0) return null;
          const stdExpanded = expandedStandards.has(standard.id);

          return (
            <div key={standard.id}>
              {/* Standard row */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-secondary/50 group"
                onClick={() => toggle(expandedStandards, setExpandedStandards, standard.id)}
              >
                {stdExpanded
                  ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                }
                <span className="text-xs font-bold flex-1 tracking-wide">
                  {standard.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {stdSubjects.length} subjects
                </span>
              </div>

              {stdExpanded && stdSubjects.map((subject) => {
                const subExpanded = expandedSubjects.has(subject.id);
                const stdSegments = segments
                  .filter((seg) =>
                    seg.standard_id === standard.id &&
                    chapters.some((c) => c.subject_id === subject.id && c.academic_segment_id === seg.id)
                  )
                  .sort((a, b) => a.sequence_number - b.sequence_number);

                // All segments for this standard (for adding chapters)
                const allStdSegments = segments
                  .filter((seg) => seg.standard_id === standard.id)
                  .sort((a, b) => a.sequence_number - b.sequence_number);

                return (
                  <div key={subject.id}>
                    {/* Subject row */}
                    <div
                      className="flex items-center gap-1.5 pl-6 pr-3 py-1.5 cursor-pointer hover:bg-secondary/50 group"
                      onClick={() => toggle(expandedSubjects, setExpandedSubjects, subject.id)}
                    >
                      {subExpanded
                        ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                        : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      }
                      <BookOpen
                        className="h-3 w-3 shrink-0"
                        style={{ color: "var(--color-brand)" }}
                      />
                      <span className="text-xs font-semibold flex-1 truncate">
                        {subject.name}
                      </span>
                    </div>

                    {subExpanded && (
                      <div>
                        {/* Segments for this subject */}
                        {allStdSegments.map((segment) => {
                          const segChapters = chapters
                            .filter((c) =>
                              c.subject_id === subject.id &&
                              c.academic_segment_id === segment.id
                            )
                            .sort((a, b) => a.chapter_number - b.chapter_number);

                          const segKey = `${subject.id}-${segment.id}`;
                          const segExpanded = expandedSegments.has(segKey);
                          const isAddingHere =
                            addChapterFor?.subjectId === subject.id &&
                            addChapterFor?.segmentId === segment.id;

                          return (
                            <div key={segment.id}>
                              {/* Segment row */}
                              <div
                                className="flex items-center gap-1.5 pl-10 pr-3 py-1.5 cursor-pointer hover:bg-secondary/50 group"
                                onClick={() => toggle(expandedSegments, setExpandedSegments, segKey)}
                              >
                                {segExpanded
                                  ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                                  : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                }
                                <span
                                  className="text-[11px] font-medium flex-1 truncate"
                                  style={{
                                    color: segment.segment_type === "unit"
                                      ? "#185FA5"
                                      : "#3B6D11",
                                  }}
                                >
                                  {segment.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground mr-1">
                                  {segChapters.length} ch
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAddChapterFor({ subjectId: subject.id, segmentId: segment.id });
                                    if (!segExpanded) toggle(expandedSegments, setExpandedSegments, segKey);
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>

                              {/* Add chapter inline form */}
                              {isAddingHere && (
                                <div className="mx-2 ml-12 my-1 p-3 rounded-lg border bg-secondary/40">
                                  <form
                                    ref={chapterAction.formRef}
                                    action={chapterAction.execute}
                                    className="flex flex-col gap-2"
                                  >
                                    <input type="hidden" name="subject_id" value={subject.id} />
                                    <input type="hidden" name="academic_segment_id" value={segment.id} />
                                    <div className="flex flex-col gap-1">
                                      <Label>Chapter name</Label>
                                      <Input
                                        name="name"
                                        placeholder="e.g. My Family and Me"
                                        className="h-7 text-xs"
                                        required
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      <div className="flex flex-col gap-1">
                                        <Label>Chapter #</Label>
                                        <Input
                                          name="chapter_number"
                                          type="number"
                                          min="1"
                                          placeholder="1"
                                          className="h-7 text-xs"
                                          required
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <Label>Periods</Label>
                                        <Input
                                          name="allocated_periods"
                                          type="number"
                                          min="1"
                                          placeholder="7"
                                          className="h-7 text-xs"
                                          required
                                        />
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <Label>Comments (optional)</Label>
                                      <Input
                                        name="comments"
                                        placeholder="e.g. PROJECT, ORAL"
                                        className="h-7 text-xs"
                                      />
                                    </div>
                                    <div className="flex gap-1.5">
                                      <Button
                                        type="submit"
                                        size="sm"
                                        className="h-7 text-xs flex-1"
                                        disabled={chapterAction.loading}
                                      >
                                        Add
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => setAddChapterFor(null)}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </form>
                                </div>
                              )}

                              {/* Chapters */}
                              {segExpanded && segChapters.map((chapter) => {
                                const status = periodStatus(chapter.id, chapter);
                                const isSelected = selectedChapterId === chapter.id;
                                const uploadedPeriods = chapterPeriods
                                  .filter((p) => p.chapter_id === chapter.id && p.lesson_plan_url)
                                  .length;

                                return (
                                  <div
                                    key={chapter.id}
                                    className={cn(
                                      "flex items-center gap-1.5 pl-14 pr-3 py-1.5 cursor-pointer group transition-colors",
                                      isSelected ? "bg-[#fce8ea]" : "hover:bg-secondary/50"
                                    )}
                                    onClick={() => onSelectChapter(chapter.id)}
                                  >
                                    {status === "complete"
                                      ? <CheckCircle2 className="h-3 w-3 shrink-0 text-green-600" />
                                      : status === "partial"
                                        ? <Circle className="h-3 w-3 shrink-0 text-amber-500" />
                                        : <Circle className="h-3 w-3 shrink-0 text-muted-foreground/30" />
                                    }
                                    <span
                                      className={cn("text-xs flex-1 truncate", isSelected && "font-medium")}
                                      style={{ color: isSelected ? "var(--color-brand)" : undefined }}
                                    >
                                      {chapter.chapter_number}. {chapter.name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                      {uploadedPeriods}/{chapter.allocated_periods}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive shrink-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteChapter(chapter.id);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}