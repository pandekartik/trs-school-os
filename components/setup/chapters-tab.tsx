"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AcademicSegment, Chapter, SchoolYear, Standard, Subject } from "@/lib/types";
import { createChapter, deleteChapter, updateChapter } from "@/lib/actions/setup";
import { useAction } from "@/lib/hooks/use-action";
import { EditableRow } from "@/components/shared/editable-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";

type ChaptersTabProps = {
  chapters: Chapter[];
  segments: AcademicSegment[];
  standards: Standard[];
  subjects: Subject[];
  schoolYears: SchoolYear[];
};

function segmentBadgeClass(segmentType: AcademicSegment["segment_type"]) {
  return segmentType === "unit"
    ? "border-blue-200 bg-blue-50 text-blue-700"
    : "border-green-200 bg-green-50 text-green-700";
}

function EditChapterForm({
  chapter,
  onDone,
}: {
  chapter: Chapter;
  onDone: () => void;
}) {
  const router = useRouter();
  const action = useAction((fd) => updateChapter(chapter.id, fd), {
    successMessage: "Chapter updated",
    onSuccess: () => {
      onDone();
      router.refresh();
    },
  });

  return (
    <form onSubmit={action.handleSubmit} className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <Label>Ch #</Label>
          <Input
            name="chapter_number"
            type="number"
            defaultValue={chapter.chapter_number}
            className="h-7 text-xs"
            required
          />
        </div>
        <div className="flex flex-col gap-1 col-span-2">
          <Label>Name</Label>
          <Input
            name="name"
            defaultValue={chapter.name}
            className="h-7 text-xs"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label>Allocated periods</Label>
          <Input
            name="allocated_periods"
            type="number"
            min="1"
            defaultValue={chapter.allocated_periods}
            className="h-7 text-xs"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Comments</Label>
          <Input
            name="comments"
            defaultValue={chapter.comments ?? ""}
            className="h-7 text-xs"
          />
        </div>
      </div>
      <Button type="submit" size="sm" className="h-7 text-xs w-fit" disabled={action.loading}>
        {action.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
      </Button>
    </form>
  );
}

export function ChaptersTab({
  chapters,
  segments,
  standards,
  subjects,
  schoolYears,
}: ChaptersTabProps) {
  const router = useRouter();
  const activeYear = schoolYears.find((year) => year.is_active) ?? null;

  const [selectedStandardId, setSelectedStandardId] = useState(standards[0]?.id ?? "");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedSegmentId, setSelectedSegmentId] = useState("");

  const selectedStandard = useMemo(
    () => standards.find((standard) => standard.id === selectedStandardId) ?? null,
    [selectedStandardId, standards]
  );
  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId) ?? null,
    [selectedSubjectId, subjects]
  );
  const selectedSegment = useMemo(
    () => segments.find((segment) => segment.id === selectedSegmentId) ?? null,
    [selectedSegmentId, segments]
  );

  const visibleSubjects = useMemo(
    () => subjects
      .filter((subject) => subject.standard_id === selectedStandardId)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [selectedStandardId, subjects]
  );

  const visibleSegments = useMemo(
    () => segments
      .filter((segment) => segment.standard_id === selectedStandardId)
      .filter((segment) => !activeYear || segment.school_year_id === activeYear.id)
      .sort((a, b) => a.sequence_number - b.sequence_number),
    [activeYear, segments, selectedStandardId]
  );

  const visibleChapters = useMemo(
    () => chapters
      .filter((chapter) => chapter.subject_id === selectedSubjectId)
      .filter((chapter) => chapter.academic_segment_id === selectedSegmentId)
      .sort((a, b) => a.chapter_number - b.chapter_number),
    [chapters, selectedSegmentId, selectedSubjectId]
  );

  useEffect(() => {
    if (!standards.length) {
      setSelectedStandardId("");
      setSelectedSubjectId("");
      setSelectedSegmentId("");
      return;
    }

    if (!selectedStandardId || !standards.some((standard) => standard.id === selectedStandardId)) {
      setSelectedStandardId(standards[0].id);
      return;
    }

    if (selectedStandardId !== selectedStandard?.id && selectedStandard) {
      const firstSubject = subjects.find((subject) => subject.standard_id === selectedStandard.id) ?? null;
      const firstSegment = segments.find((segment) => segment.standard_id === selectedStandard.id && (!activeYear || segment.school_year_id === activeYear.id)) ?? null;
      setSelectedSubjectId(firstSubject?.id ?? "");
      setSelectedSegmentId(firstSegment?.id ?? "");
    }
  }, [activeYear, selectedStandard, selectedStandardId, segments, standards, subjects]);

  useEffect(() => {
    if (!selectedStandardId) return;
    if (selectedSubjectId && visibleSubjects.some((subject) => subject.id === selectedSubjectId)) return;
    setSelectedSubjectId(visibleSubjects[0]?.id ?? "");
  }, [selectedStandardId, selectedSubjectId, visibleSubjects]);

  useEffect(() => {
    if (!selectedStandardId) return;
    if (selectedSegmentId && visibleSegments.some((segment) => segment.id === selectedSegmentId)) return;
    setSelectedSegmentId(visibleSegments[0]?.id ?? "");
  }, [selectedSegmentId, selectedStandardId, visibleSegments]);

  const addAction = useAction(createChapter, {
    successMessage: "Chapter created",
    onSuccess: () => router.refresh(),
  });

  async function handleDelete(id: string) {
    const result = await deleteChapter(id);
    if (result?.error) {
      toast.error("Delete failed", { description: result.error });
      return;
    }

    toast.success("Chapter deleted");
    router.refresh();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[200px_180px_1fr]">
      <Card className="overflow-hidden">
        <CardHeader className="border-b px-4 py-3">
          <CardTitle className="text-sm">Standards</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[560px] overflow-y-auto p-2">
            <div className="flex flex-col gap-1">
              {standards.length === 0 ? (
                <p className="px-2 py-3 text-xs text-muted-foreground">No standards found.</p>
              ) : (
                standards.map((standard) => {
                  const isSelected = standard.id === selectedStandardId;
                  return (
                    <button
                      key={standard.id}
                      type="button"
                      onClick={() => {
                        setSelectedStandardId(standard.id);
                        const firstSubject = subjects.find((subject) => subject.standard_id === standard.id) ?? null;
                        const firstSegment = segments.find((segment) => segment.standard_id === standard.id && (!activeYear || segment.school_year_id === activeYear.id)) ?? null;
                        setSelectedSubjectId(firstSubject?.id ?? "");
                        setSelectedSegmentId(firstSegment?.id ?? "");
                      }}
                      className={[
                        "rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                        isSelected
                          ? "border-[#ba2032] bg-[#ba2032] text-white"
                          : "border-border bg-secondary/30 hover:bg-secondary/50",
                      ].join(" ")}
                    >
                      <div className="font-medium">{standard.name}</div>
                      <div className={isSelected ? "text-white/80" : "text-muted-foreground"}>
                        Grade {standard.grade}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Subjects
              </div>
              <div className="flex flex-col gap-1">
                {visibleSubjects.length === 0 ? (
                  <p className="px-2 py-3 text-xs text-muted-foreground">
                    No subjects for this standard.
                  </p>
                ) : (
                  visibleSubjects.map((subject) => {
                    const isSelected = subject.id === selectedSubjectId;
                    return (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => setSelectedSubjectId(subject.id)}
                        className={[
                          "rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                          isSelected
                            ? "border-[#ba2032] bg-[#ba2032] text-white"
                            : "border-border bg-secondary/30 hover:bg-secondary/50",
                        ].join(" ")}
                      >
                        <div className="font-medium">{subject.name}</div>
                        <div className={isSelected ? "text-white/80" : "text-muted-foreground"}>
                          {subject.has_chapters ? "Has chapters" : "No chapters"}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b px-4 py-3">
          <CardTitle className="text-sm">Segments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[560px] overflow-y-auto p-2">
            {!activeYear ? (
              <div className="px-2 py-6 text-center text-xs text-muted-foreground">
                No active school year found.
              </div>
            ) : visibleSegments.length === 0 ? (
              <div className="px-2 py-6 text-center text-xs text-muted-foreground">
                No segments found - go to Segments tab
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {visibleSegments.map((segment) => {
                  const isSelected = segment.id === selectedSegmentId;
                  return (
                    <button
                      key={segment.id}
                      type="button"
                      onClick={() => setSelectedSegmentId(segment.id)}
                      className={[
                        "rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                        isSelected
                          ? "border-[#ba2032] bg-[#ba2032] text-white"
                          : "border-border bg-secondary/30 hover:bg-secondary/50",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{segment.name}</div>
                          <div className={isSelected ? "text-white/80" : "text-muted-foreground"}>
                            {selectedStandard?.name ?? "Standard"}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={[
                            "shrink-0 border text-[10px] font-normal capitalize",
                            segmentBadgeClass(segment.segment_type),
                          ].join(" ")}
                        >
                          {segment.segment_type}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm">Chapters</CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {selectedSubject?.name ?? "Select a subject"} {selectedSegment ? `· ${selectedSegment.name}` : ""}
              </p>
            </div>
            <Badge variant="outline" className="font-normal">
              {visibleChapters.length} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[560px] overflow-y-auto">
            {!selectedSubjectId || !selectedSegmentId ? (
              <div className="px-4 py-10 text-center text-xs text-muted-foreground">
                Select a standard, subject, and segment to view chapters.
              </div>
            ) : (
              <div className="p-2">
                {visibleChapters.length === 0 ? (
                  <div className="rounded-lg border border-dashed bg-secondary/20 px-4 py-8 text-center text-xs text-muted-foreground">
                    <p>No chapters yet. Add the first one below.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {visibleChapters.map((chapter) => (
                      <EditableRow
                        key={chapter.id}
                        editForm={<EditChapterForm chapter={chapter} onDone={() => router.refresh()} />}
                        onDelete={() => handleDelete(chapter.id)}
                        deleteConfirmText="Delete chapter?"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium">
                              Ch {chapter.chapter_number} · {chapter.name}
                            </span>
                            <Badge
                              className="h-5 border px-2 text-[10px] font-normal"
                              variant="outline"
                            >
                              {chapter.allocated_periods} periods
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                            <span>{chapter.effective_periods} effective (80%)</span>
                            {chapter.comments && (
                              <span className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-amber-700">
                                {chapter.comments}
                              </span>
                            )}
                          </div>
                        </div>
                      </EditableRow>
                    ))}
                  </div>
                )}

                <div className="mt-3 rounded-lg border bg-[#fce8ea]/40 p-3">
                  <form onSubmit={addAction.handleSubmit} className="flex flex-col gap-2">
                    <input type="hidden" name="subject_id" value={selectedSubjectId} />
                    <input type="hidden" name="academic_segment_id" value={selectedSegmentId} />
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col gap-1">
                        <Label>Ch #</Label>
                        <Input name="chapter_number" type="number" min="1" className="h-7 text-xs" required />
                      </div>
                      <div className="flex flex-col gap-1 col-span-2">
                        <Label>Name</Label>
                        <Input name="name" className="h-7 text-xs" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <Label>Allocated periods</Label>
                        <Input name="allocated_periods" type="number" min="1" className="h-7 text-xs" required />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>Comments</Label>
                        <Input name="comments" className="h-7 text-xs" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] text-muted-foreground">
                        Effective periods are auto-calculated by the database trigger.
                      </p>
                      <Button
                        type="submit"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={addAction.loading || !selectedSubjectId || !selectedSegmentId}
                      >
                        {addAction.loading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                        Add chapter
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
