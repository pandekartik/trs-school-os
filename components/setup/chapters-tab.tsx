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
import { FileText, Loader2, Plus } from "lucide-react";

type ChaptersTabProps = {
  chapters: Chapter[];
  segments: AcademicSegment[];
  standards: Standard[];
  subjects: Subject[];
  schoolYears: SchoolYear[];
};

function effectivePeriods(value: string | number) {
  const allocated = Number(value) || 0;
  return Math.ceil(allocated * 1.3);
}

function EditChapterForm({
  chapter,
  onDone,
}: {
  chapter: Chapter;
  onDone: () => void;
}) {
  const router = useRouter();
  const [allocatedPeriods, setAllocatedPeriods] = useState(String(chapter.allocated_periods));
  const action = useAction((fd) => updateChapter(chapter.id, fd), {
    successMessage: "Chapter updated",
    onSuccess: () => {
      onDone();
      router.refresh();
    },
  });

  return (
    <form onSubmit={action.handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-[96px_1fr] gap-2">
        <div className="flex flex-col gap-1.5">
          <Label>Chapter number</Label>
          <Input
            name="chapter_number"
            type="number"
            defaultValue={chapter.chapter_number}
            className="h-8 rounded-md border-[#D4D4D4] text-xs"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Chapter name</Label>
          <Input
            name="name"
            defaultValue={chapter.name}
            className="h-8 rounded-md border-[#D4D4D4] text-xs"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-[132px_1fr] gap-2">
        <div className="flex flex-col gap-1.5">
          <Label>Allocated periods</Label>
          <Input
            name="allocated_periods"
            type="number"
            min="1"
            value={allocatedPeriods}
            onChange={(event) => setAllocatedPeriods(event.target.value)}
            className="h-8 rounded-md border-[#D4D4D4] text-xs"
            required
          />
          <p className="text-[11px] text-[#737373]">{effectivePeriods(allocatedPeriods)} effective periods</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Comments</Label>
          <Input
            name="comments"
            defaultValue={chapter.comments ?? ""}
            className="h-8 rounded-md border-[#D4D4D4] text-xs"
          />
        </div>
      </div>
      <Button type="submit" size="sm" className="h-8 w-fit rounded-md bg-[#ba2032] text-xs text-white hover:bg-[#ba2032]" disabled={action.loading}>
        {action.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
      </Button>
    </form>
  );
}

function AddChapterForm({
  selectedSubjectId,
  selectedSegmentId,
  loading,
  onSubmit,
  onCancel,
}: {
  selectedSubjectId: string;
  selectedSegmentId: string;
  loading: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const [allocatedPeriods, setAllocatedPeriods] = useState("1");

  return (
    <form onSubmit={onSubmit} className="border-b border-[#F5F5F5] bg-[#FAFAFA] p-4">
      <input type="hidden" name="subject_id" value={selectedSubjectId} />
      <input type="hidden" name="academic_segment_id" value={selectedSegmentId} />
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-[96px_1fr] gap-2">
          <div className="flex flex-col gap-1.5">
            <Label>Chapter number</Label>
            <Input name="chapter_number" type="number" min="1" className="h-8 rounded-md border-[#D4D4D4] text-xs" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Chapter name</Label>
            <Input name="name" className="h-8 rounded-md border-[#D4D4D4] text-xs" required />
          </div>
        </div>
        <div className="grid grid-cols-[132px_1fr] gap-2">
          <div className="flex flex-col gap-1.5">
            <Label>Allocated periods</Label>
            <Input
              name="allocated_periods"
              type="number"
              min="1"
              value={allocatedPeriods}
              onChange={(event) => setAllocatedPeriods(event.target.value)}
              className="h-8 rounded-md border-[#D4D4D4] text-xs"
              required
            />
            <p className="text-[11px] text-[#737373]">{effectivePeriods(allocatedPeriods)} effective periods</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Comments optional</Label>
            <Input name="comments" className="h-8 rounded-md border-[#D4D4D4] text-xs" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" className="h-8 rounded-md border-[#E5E5E5] bg-[#F5F5F5] text-[#171717] hover:bg-[#F5F5F5]" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" className="h-8 rounded-md bg-[#ba2032] text-xs text-white hover:bg-[#ba2032]" disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>
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
  const [showAddForm, setShowAddForm] = useState(false);

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
      .filter((subject) => subject.has_chapters)
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

  const canShowChapters = Boolean(selectedStandardId && selectedSubjectId && selectedSegmentId);

  useEffect(() => {
    if (!standards.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      const firstSubject = subjects.find((subject) => subject.standard_id === selectedStandard.id && subject.has_chapters) ?? null;
      const firstSegment = segments.find((segment) => segment.standard_id === selectedStandard.id && (!activeYear || segment.school_year_id === activeYear.id)) ?? null;
      setSelectedSubjectId(firstSubject?.id ?? "");
      setSelectedSegmentId(firstSegment?.id ?? "");
    }
  }, [activeYear, selectedStandard, selectedStandardId, segments, standards, subjects]);

  useEffect(() => {
    if (!selectedStandardId) return;
    if (selectedSubjectId && visibleSubjects.some((subject) => subject.id === selectedSubjectId)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedSubjectId(visibleSubjects[0]?.id ?? "");
  }, [selectedStandardId, selectedSubjectId, visibleSubjects]);

  useEffect(() => {
    if (!selectedStandardId) return;
    if (selectedSegmentId && visibleSegments.some((segment) => segment.id === selectedSegmentId)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedSegmentId(visibleSegments[0]?.id ?? "");
  }, [selectedSegmentId, selectedStandardId, visibleSegments]);

  const addAction = useAction(createChapter, {
    successMessage: "Chapter created",
    onSuccess: () => {
      setShowAddForm(false);
      router.refresh();
    },
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
    <div className="min-h-full bg-[#FAFAFA]">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#171717]">Chapters</h1>
        <p className="mt-1 text-sm text-[#737373]">Define chapters per subject and segment.</p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {standards.map((standard) => {
            const isSelected = standard.id === selectedStandardId;
            return (
              <button
                key={standard.id}
                type="button"
                onClick={() => {
                  setSelectedStandardId(standard.id);
                  const firstSubject = subjects.find((subject) => subject.standard_id === standard.id && subject.has_chapters) ?? null;
                  const firstSegment = segments.find((segment) => segment.standard_id === standard.id && (!activeYear || segment.school_year_id === activeYear.id)) ?? null;
                  setSelectedSubjectId(firstSubject?.id ?? "");
                  setSelectedSegmentId(firstSegment?.id ?? "");
                  setShowAddForm(false);
                }}
                className={[
                  "h-7 rounded-md px-3 text-xs font-medium transition-colors",
                  isSelected ? "bg-[#171717] text-white" : "bg-[#F5F5F5] text-[#525252] hover:bg-[#E5E5E5]",
                ].join(" ")}
              >
                {standard.name}
              </button>
            );
          })}
        </div>

        <Select value={selectedSubjectId} onValueChange={(value) => { setSelectedSubjectId(value); setShowAddForm(false); }}>
          <SelectTrigger className="h-8 w-[200px] rounded-md border-[#D4D4D4] bg-white text-xs">
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent>
            {visibleSubjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap items-center gap-2">
          {visibleSegments.map((segment) => {
            const isSelected = segment.id === selectedSegmentId;
            return (
              <button
                key={segment.id}
                type="button"
                onClick={() => { setSelectedSegmentId(segment.id); setShowAddForm(false); }}
                className={[
                  "h-7 rounded-md px-3 text-xs font-medium transition-colors",
                  isSelected ? "bg-[#171717] text-white" : "bg-[#F5F5F5] text-[#525252] hover:bg-[#E5E5E5]",
                ].join(" ")}
              >
                {segment.name}
              </button>
            );
          })}
        </div>
      </div>

      {canShowChapters && (
        <Card className="gap-0 rounded-lg border-[#E5E5E5] bg-white py-0 shadow-none">
          <CardHeader className="border-b border-[#E5E5E5] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <CardTitle className="truncate text-sm font-semibold text-[#171717]">
                  {selectedSubject?.name} — {selectedSegment?.name}
                </CardTitle>
                <Badge variant="outline" className="h-5 rounded px-2 text-[11px] font-medium">
                  {visibleChapters.length}
                </Badge>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-8 rounded-md bg-[#ba2032] text-xs text-white hover:bg-[#ba2032]"
                onClick={() => setShowAddForm((value) => !value)}
              >
                <Plus className="h-3 w-3" />
                Add chapter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {showAddForm && (
              <AddChapterForm
                selectedSubjectId={selectedSubjectId}
                selectedSegmentId={selectedSegmentId}
                loading={addAction.loading}
                onSubmit={addAction.handleSubmit}
                onCancel={() => setShowAddForm(false)}
              />
            )}

            {visibleChapters.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center text-xs text-[#737373]">
                <FileText className="mb-2 h-8 w-8 text-[#A3A3A3]" />
                <p className="font-medium text-[#525252]">No chapters yet for this subject and segment</p>
                <p className="mt-0.5">Add your first chapter above</p>
              </div>
            ) : (
              <div>
                <div className="grid h-9 grid-cols-[72px_1.5fr_116px_116px_1fr_72px] items-center border-b border-[#E5E5E5] bg-[#FAFAFA] px-4 text-[11px] font-medium uppercase text-[#A3A3A3]">
                  <div>Ch#</div>
                  <div>Chapter name</div>
                  <div>Allocated</div>
                  <div>Effective</div>
                  <div>Comments</div>
                  <div className="text-right">Actions</div>
                </div>
                {visibleChapters.map((chapter) => (
                  <EditableRow
                    key={chapter.id}
                    editForm={<EditChapterForm chapter={chapter} onDone={() => router.refresh()} />}
                    onDelete={() => handleDelete(chapter.id)}
                    deleteConfirmText="Delete chapter?"
                    className="min-h-11 rounded-none border-x-0 border-t-0 border-b border-[#F5F5F5] bg-white px-4 py-0 hover:bg-[#FAFAFA] [&>div:first-child]:min-w-0"
                  >
                    <div className="grid min-h-11 grid-cols-[72px_1.5fr_116px_116px_1fr] items-center gap-0">
                      <div className="text-sm font-medium text-[#171717]">{chapter.chapter_number}</div>
                      <div className="truncate text-sm font-medium text-[#171717]">{chapter.name}</div>
                      <div>
                        <div className="text-sm font-medium text-[#171717]">{chapter.allocated_periods}</div>
                        <div className="text-[11px] text-[#737373]">periods</div>
                      </div>
                      <div className="text-xs text-[#737373]">{effectivePeriods(chapter.allocated_periods)}</div>
                      <div>
                        {chapter.comments && (
                          <Badge className="h-5 rounded border border-amber-200 bg-amber-50 px-2 text-[11px] font-medium text-amber-700">
                            {chapter.comments}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </EditableRow>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
