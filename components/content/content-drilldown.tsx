"use client";

import { useState } from "react";
import {
  AcademicSegment, Standard, Subject, Chapter,
  ChapterPeriod, ChapterMcq, ChapterTest,
} from "@/lib/types";
import {
  createChapter, updateChapter, deleteChapter,
  saveChapterPeriod, updateChapterPeriodFile,
  togglePeriodPublish, saveMcq, saveTest,
} from "@/lib/actions/setup";
import { useAction } from "@/lib/hooks/use-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronRight, Plus, Pencil, Trash2, X,
  Upload, Download, Eye, EyeOff, FileText,
  Hash, Clock, Loader2, Save, Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useRef } from "react";

type SchoolYear = {
  id: string; name: string;
  start_date: string; end_date: string; is_active: boolean;
};

interface Props {
  schoolYears: SchoolYear[];
  segments: AcademicSegment[];
  standards: Standard[];
  subjects: Subject[];
  chapters: Chapter[];
  chapterPeriods: ChapterPeriod[];
  mcqs: ChapterMcq[];
  tests: ChapterTest[];
}

export function ContentDrilldown({
  schoolYears, segments, standards, subjects,
  chapters, chapterPeriods, mcqs, tests,
}: Props) {
  const { user } = useUser();
  const activeYear = schoolYears.find((y) => y.is_active);

  // Breadcrumb selection state
  const [selectedYearId, setSelectedYearId]       = useState(activeYear?.id ?? schoolYears[0]?.id ?? "");
  const [selectedStandardId, setSelectedStandardId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId]   = useState<string | null>(null);
  const [selectedSegmentId, setSelectedSegmentId]   = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId]   = useState<string | null>(null);

  // UI state
  const [addingChapter, setAddingChapter] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [uploadingPeriod, setUploadingPeriod] = useState<number | null>(null);
  const [savingMcq, setSavingMcq] = useState(false);
  const [savingTest, setSavingTest] = useState(false);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const chapterAction = useAction(createChapter, {
    successMessage: "Chapter created",
    onSuccess: () => setAddingChapter(false),
  });

  const selectedYear     = schoolYears.find((y) => y.id === selectedYearId);
  const isArchive        = selectedYear && !selectedYear.is_active;

  const stdSubjects      = subjects.filter((s) => s.standard_id === selectedStandardId);
  const subSegments      = selectedSubjectId && selectedStandardId
    ? segments.filter((seg) =>
        seg.standard_id === selectedStandardId &&
        seg.school_year_id === selectedYearId
      ).sort((a, b) => a.sequence_number - b.sequence_number)
    : [];

  const segChapters = chapters
    .filter((c) =>
      c.subject_id === selectedSubjectId &&
      c.academic_segment_id === selectedSegmentId
    )
    .sort((a, b) => a.chapter_number - b.chapter_number);

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId) ?? null;
  const selectedPeriods = chapterPeriods
    .filter((p) => p.chapter_id === selectedChapterId)
    .sort((a, b) => a.period_number - b.period_number);
  const selectedMcq  = mcqs.find((m) => m.chapter_id === selectedChapterId) ?? null;
  const selectedTest = tests.find((t) => t.chapter_id === selectedChapterId) ?? null;

  function selectStandard(id: string) {
    setSelectedStandardId(id);
    setSelectedSubjectId(null);
    setSelectedSegmentId(null);
    setSelectedChapterId(null);
    setAddingChapter(false);
  }

  function selectSubject(id: string) {
    setSelectedSubjectId(id);
    setSelectedSegmentId(null);
    setSelectedChapterId(null);
    setAddingChapter(false);
  }

  function selectSegment(id: string) {
    setSelectedSegmentId(id);
    setSelectedChapterId(null);
    setAddingChapter(false);
  }

  async function handleDeleteChapter(id: string) {
    const r = await deleteChapter(id);
    if (r?.error) toast.error("Failed", { description: r.error });
    else { toast.success("Chapter deleted"); setSelectedChapterId(null); }
  }

  async function handleFileUpload(periodNumber: number, file: File) {
    setUploadingPeriod(periodNumber);
    try {
      const fd = new FormData();
      fd.append("chapter_id", selectedChapterId!);
      fd.append("period_number", String(periodNumber));
      fd.append("uploaded_by", user?.id ?? "");
      await saveChapterPeriod(fd);

      const uploadFd = new FormData();
      uploadFd.append("file", file);
      uploadFd.append("chapter_id", selectedChapterId!);
      uploadFd.append("period_number", String(periodNumber));

      const res  = await fetch("/api/upload-lesson-plan", { method: "POST", body: uploadFd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const period = selectedPeriods.find((p) => p.period_number === periodNumber);
      if (period) {
        await updateChapterPeriodFile(period.id, data.url, data.filename, data.file_type);
      }
      toast.success(`Period ${periodNumber} — file uploaded`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error("Upload failed", { description: message });
    } finally {
      setUploadingPeriod(null);
    }
  }

  async function handleTogglePublish(period: ChapterPeriod) {
    await togglePeriodPublish(period.id, !period.is_published);
    toast.success(period.is_published ? "Unpublished" : "Published");
  }

  async function handleSaveMcq(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingMcq(true);
    const r = await saveMcq(new FormData(e.currentTarget));
    if (r?.error) toast.error("Failed", { description: r.error });
    else toast.success("MCQs saved");
    setSavingMcq(false);
  }

  async function handleSaveTest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingTest(true);
    const r = await saveTest(new FormData(e.currentTarget));
    if (r?.error) toast.error("Failed", { description: r.error });
    else toast.success("Test saved");
    setSavingTest(false);
  }

  return (
    <div className="flex flex-col gap-0 h-full">

      {/* ── TOP BAR ─────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Content</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage lesson plans, MCQs and tests
          </p>
        </div>
        {/* Year selector */}
        <div className="flex items-center gap-2">
          {isArchive && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
              <Archive className="h-3 w-3" />
              Archive — view only
            </div>
          )}
          <Select value={selectedYearId} onValueChange={(v) => {
            setSelectedYearId(v);
            setSelectedStandardId(null);
            setSelectedSubjectId(null);
            setSelectedSegmentId(null);
            setSelectedChapterId(null);
          }}>
            <SelectTrigger className="h-8 text-xs w-96">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {schoolYears.map((y) => (
                <SelectItem key={y.id} value={y.id}>
                  <div className="flex items-center gap-2">
                    {y.name}
                    {y.is_active && (
                      <Badge className="text-[9px] h-4 px-1.5">Active</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── BREADCRUMB SELECTORS ─────────────────── */}
      <div className="flex items-center gap-1.5 mb-6 flex-wrap">
        {/* Standards */}
        <div className="flex items-center gap-1 flex-wrap">
          {standards.map((std) => (
            <button
              key={std.id}
              onClick={() => selectStandard(std.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                selectedStandardId === std.id
                  ? "bg-[#ba2032] text-white border-[#ba2032]"
                  : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:border-border/80"
              )}
            >
              {std.name}
            </button>
          ))}
        </div>

        {selectedStandardId && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {/* Subjects */}
            <div className="flex items-center gap-1 flex-wrap">
              {stdSubjects.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => selectSubject(sub.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    selectedSubjectId === sub.id
                      ? "bg-[#ba2032] text-white border-[#ba2032]"
                      : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {sub.name}
                </button>
              ))}
              {stdSubjects.length === 0 && (
                <span className="text-xs text-muted-foreground italic">
                  No subjects with chapters for this standard
                </span>
              )}
            </div>
          </>
        )}

        {selectedSubjectId && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {/* Segments */}
            <div className="flex items-center gap-1 flex-wrap">
              {subSegments.map((seg) => (
                <button
                  key={seg.id}
                  onClick={() => selectSegment(seg.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    selectedSegmentId === seg.id
                      ? "bg-[#ba2032] text-white border-[#ba2032]"
                      : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {seg.name}
                </button>
              ))}
              {subSegments.length === 0 && (
                <span className="text-xs text-muted-foreground italic">
                  No segments — add them in Setup → Segments
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── MAIN CONTENT AREA ───────────────────── */}
      {!selectedStandardId && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: "var(--color-brand-light)" }}
            >
              <BookIcon />
            </div>
            <p className="text-sm font-medium">Select a standard to start</p>
            <p className="text-xs text-muted-foreground mt-1">
              Choose from the standards above to browse content
            </p>
          </div>
        </div>
      )}

      {selectedStandardId && selectedSubjectId && selectedSegmentId && (
        <div className="flex gap-4 flex-1" style={{ minHeight: "calc(100vh - 280px)" }}>

          {/* Left — Chapter list */}
          <div
            className="shrink-0 flex flex-col rounded-xl border bg-card overflow-hidden"
            style={{ width: "260px" }}
          >
            <div className="px-4 py-3 border-b flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Chapters
              </span>
              {!isArchive && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setAddingChapter(true)}
                  title="Add chapter"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Add chapter form */}
              {addingChapter && !isArchive && (
                <div className="p-3 border-b bg-[#fce8ea]/50">
                  <form
                    onSubmit={chapterAction.handleSubmit}
                    className="flex flex-col gap-2"
                  >
                    <input type="hidden" name="subject_id" value={selectedSubjectId} />
                    <input type="hidden" name="academic_segment_id" value={selectedSegmentId} />
                    <div className="flex flex-col gap-1">
                      <Label>Chapter name</Label>
                      <Input name="name" placeholder="e.g. My Family and Me" className="h-7 text-xs" required />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="flex flex-col gap-1">
                        <Label>Ch #</Label>
                        <Input name="chapter_number" type="number" min="1" placeholder="1" className="h-7 text-xs" required />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>Periods</Label>
                        <Input name="allocated_periods" type="number" min="1" placeholder="7" className="h-7 text-xs" required />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Comments</Label>
                      <Input name="comments" placeholder="PROJECT, ORAL..." className="h-7 text-xs" />
                    </div>
                    <div className="flex gap-1.5">
                      <Button type="submit" size="sm" className="h-7 text-xs flex-1" disabled={chapterAction.loading}>
                        {chapterAction.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setAddingChapter(false)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Chapter list */}
              {segChapters.length === 0 && !addingChapter ? (
                <div className="px-4 py-8 text-xs text-muted-foreground text-center">
                  <p>No chapters yet.</p>
                  {!isArchive && (
                    <button
                      className="mt-2 text-[color:var(--color-brand)] hover:underline"
                      onClick={() => setAddingChapter(true)}
                    >
                      + Add first chapter
                    </button>
                  )}
                </div>
              ) : (
                segChapters.map((ch) => {
                  const uploaded = chapterPeriods.filter(
                    (p) => p.chapter_id === ch.id && p.lesson_plan_url
                  ).length;
                  const isSelected = selectedChapterId === ch.id;
                  const isEditing  = editingChapterId === ch.id;

                  return (
                    <div key={ch.id}>
                      {isEditing && !isArchive ? (
                        <EditChapterForm
                          chapter={ch}
                          onDone={() => setEditingChapterId(null)}
                        />
                      ) : (
                        <div
                          className={cn(
                            "px-4 py-3 cursor-pointer border-b group transition-colors",
                            isSelected
                              ? "bg-[#fce8ea] border-l-2 border-l-[#ba2032]"
                              : "hover:bg-secondary/40"
                          )}
                          onClick={() => setSelectedChapterId(ch.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  "text-xs font-medium leading-tight truncate",
                                  isSelected && "text-[#ba2032]"
                                )}
                              >
                                {ch.chapter_number}. {ch.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[10px] text-muted-foreground">
                                  {uploaded}/{ch.allocated_periods} files
                                </span>
                                {ch.comments && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700">
                                    {ch.comments}
                                  </span>
                                )}
                              </div>
                            </div>
                            {!isArchive && (
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingChapterId(ch.id);
                                    setSelectedChapterId(ch.id);
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteChapter(ch.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right — Content editor */}
          <div className="flex-1 rounded-xl border bg-card overflow-hidden flex flex-col">
            {!selectedChapter ? (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ background: "var(--color-brand-light)" }}
                  >
                    <FileText className="h-5 w-5" style={{ color: "var(--color-brand)" }} />
                  </div>
                  <p className="text-sm font-medium">Select a chapter</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose from the list to manage its content
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chapter header */}
                <div className="px-6 py-4 border-b shrink-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-base font-semibold">
                        Ch {selectedChapter.chapter_number} — {selectedChapter.name}
                      </h2>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {selectedChapter.allocated_periods} periods
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {selectedChapter.effective_periods} effective
                        </span>
                        {selectedChapter.comments && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[10px]">
                            {selectedChapter.comments}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-semibold text-base text-foreground">
                        {selectedPeriods.filter((p) => p.lesson_plan_url).length}
                        <span className="text-muted-foreground font-normal text-xs">
                          /{selectedChapter.allocated_periods}
                        </span>
                      </div>
                      <div className="text-muted-foreground">files uploaded</div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="periods" className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-6 pt-4 shrink-0">
                    <TabsList>
                      <TabsTrigger value="periods">
                        Lesson plans
                      </TabsTrigger>
                      <TabsTrigger value="mcqs">
                        MCQs {selectedMcq ? "✓" : ""}
                      </TabsTrigger>
                      <TabsTrigger value="test">
                        Test {selectedTest ? "✓" : ""}
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Periods tab */}
                  <TabsContent value="periods" className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="flex flex-col gap-2">
                      {Array.from(
                        { length: selectedChapter.allocated_periods },
                        (_, i) => i + 1
                      ).map((num) => {
                        const period     = selectedPeriods.find((p) => p.period_number === num);
                        const isUploading = uploadingPeriod === num;

                        return (
                          <div
                            key={num}
                            className={cn(
                              "border rounded-xl p-4 transition-colors",
                              period?.lesson_plan_url
                                ? "bg-green-50/40 border-green-200"
                                : "bg-secondary/20 border-border"
                            )}
                          >
                            <div className="flex items-center gap-3 flex-wrap">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                                style={{
                                  background: period?.lesson_plan_url ? "#dcfce7" : "var(--color-brand-light)",
                                  color: period?.lesson_plan_url ? "#16a34a" : "var(--color-brand)",
                                }}
                              >
                                {num}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium">
                                  Period {num} of {selectedChapter.allocated_periods}
                                </div>
                                {period?.lesson_plan_filename && (
                                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <FileText className="h-2.5 w-2.5" />
                                    {period.lesson_plan_filename}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                                <Input
                                  placeholder="Period title"
                                  defaultValue={period?.title ?? ""}
                                  className="h-7 text-xs w-36"
                                  disabled={isArchive ?? false}
                                  onBlur={async (e) => {
                                    if (!isArchive && e.target.value !== (period?.title ?? "")) {
                                      const fd = new FormData();
                                      fd.append("chapter_id", selectedChapterId!);
                                      fd.append("period_number", String(num));
                                      fd.append("title", e.target.value);
                                      fd.append("uploaded_by", user?.id ?? "");
                                      await saveChapterPeriod(fd);
                                      toast.success("Title saved");
                                    }
                                  }}
                                />

                                {!isArchive && (
                                  <>
                                    <input
                                      ref={(el) => { fileInputRefs.current[num] = el; }}
                                      type="file"
                                      accept=".pdf,.docx,.doc"
                                      className="hidden"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) await handleFileUpload(num, file);
                                        e.target.value = "";
                                      }}
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs gap-1"
                                      disabled={isUploading}
                                      onClick={() => fileInputRefs.current[num]?.click()}
                                    >
                                      {isUploading
                                        ? <Loader2 className="h-3 w-3 animate-spin" />
                                        : <Upload className="h-3 w-3" />
                                      }
                                      {period?.lesson_plan_url ? "Replace" : "Upload"}
                                    </Button>
                                  </>
                                )}

                                {period?.lesson_plan_url && (
                                  <a href={period.lesson_plan_url} target="_blank" rel="noopener noreferrer">
                                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                                      <Download className="h-3 w-3" />
                                      View
                                    </Button>
                                  </a>
                                )}

                                {period && !isArchive && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                      "h-7 text-xs gap-1",
                                      period.is_published ? "text-green-700" : "text-muted-foreground"
                                    )}
                                    onClick={() => handleTogglePublish(period)}
                                  >
                                    {period.is_published
                                      ? <><Eye className="h-3 w-3" />Published</>
                                      : <><EyeOff className="h-3 w-3" />Draft</>
                                    }
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>

                  {/* MCQs */}
                  <TabsContent value="mcqs" className="flex-1 overflow-y-auto px-6 py-4">
                    <form onSubmit={handleSaveMcq} className="flex flex-col gap-3">
                      <input type="hidden" name="chapter_id" value={selectedChapterId ?? ""} />
                      <input type="hidden" name="uploaded_by" value={user?.id ?? ""} />
                      <div className="flex items-center justify-between">
                        <Label>MCQ set</Label>
                        <span className="text-xs text-muted-foreground">
                          {Array.isArray(selectedMcq?.mcq_set_json)
                            ? selectedMcq.mcq_set_json.length
                            : 0} questions saved
                        </span>
                      </div>
                      <div className="px-3 py-2 rounded-lg bg-secondary/50 border text-xs text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Format</p>
                        <pre className="text-[11px] overflow-auto">{`[{"question":"...","options":["A","B","C","D"],"answer":0,"difficulty":"easy","explanation":"..."}]`}</pre>
                      </div>
                      <textarea
                        name="mcq_set_json"
                        defaultValue={selectedMcq?.mcq_set_json ? JSON.stringify(selectedMcq.mcq_set_json, null, 2) : ""}
                        placeholder="Paste MCQ JSON array..."
                        disabled={isArchive ?? false}
                        className="resize-none rounded-lg border p-3 text-xs font-mono focus:outline-none focus:border-[color:var(--color-brand)]"
                        style={{ minHeight: "280px", background: "var(--color-background)" }}
                      />
                      {!isArchive && (
                        <div className="flex justify-end">
                          <Button type="submit" size="sm" className="h-8 gap-1.5" disabled={savingMcq}>
                            {savingMcq ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</> : <><Save className="h-3.5 w-3.5" />Save MCQs</>}
                          </Button>
                        </div>
                      )}
                    </form>
                  </TabsContent>

                  {/* Test */}
                  <TabsContent value="test" className="flex-1 overflow-y-auto px-6 py-4">
                    <form onSubmit={handleSaveTest} className="flex flex-col gap-3">
                      <input type="hidden" name="chapter_id" value={selectedChapterId ?? ""} />
                      <input type="hidden" name="uploaded_by" value={user?.id ?? ""} />
                      <div className="flex items-center justify-between">
                        <Label>Chapter test</Label>
                        <span className="text-xs text-muted-foreground">
                          {selectedTest ? "Test saved" : "No test yet"}
                        </span>
                      </div>
                      <textarea
                        name="test_json"
                        defaultValue={selectedTest?.test_json ? JSON.stringify(selectedTest.test_json, null, 2) : ""}
                        placeholder='{"title":"...","max_marks":25,"sections":[...]}'
                        disabled={isArchive ?? false}
                        className="resize-none rounded-lg border p-3 text-xs font-mono focus:outline-none focus:border-[color:var(--color-brand)]"
                        style={{ minHeight: "280px", background: "var(--color-background)" }}
                      />
                      {!isArchive && (
                        <div className="flex justify-end">
                          <Button type="submit" size="sm" className="h-8 gap-1.5" disabled={savingTest}>
                            {savingTest ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</> : <><Save className="h-3.5 w-3.5" />Save test</>}
                          </Button>
                        </div>
                      )}
                    </form>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </div>
      )}

      {/* Prompt to select segment */}
      {selectedStandardId && selectedSubjectId && !selectedSegmentId && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">
            Select a segment above (Unit 1, Term 1...) to view chapters
          </p>
        </div>
      )}
    </div>
  );
}

// Edit chapter inline form
function EditChapterForm({
  chapter, onDone,
}: {
  chapter: Chapter;
  onDone: () => void;
}) {
  const action = useAction((fd) => updateChapter(chapter.id, fd), {
    successMessage: "Chapter updated",
    onSuccess: onDone,
  });

  return (
    <div className="p-3 border-b bg-[#fce8ea]/50">
      <form onSubmit={action.handleSubmit} className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <Label>Name</Label>
          <Input name="name" defaultValue={chapter.name} className="h-7 text-xs" required />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="flex flex-col gap-1">
            <Label>Ch #</Label>
            <Input name="chapter_number" type="number" defaultValue={chapter.chapter_number} className="h-7 text-xs" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Periods</Label>
            <Input name="allocated_periods" type="number" defaultValue={chapter.allocated_periods} className="h-7 text-xs" required />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Label>Comments</Label>
          <Input name="comments" defaultValue={chapter.comments ?? ""} className="h-7 text-xs" />
        </div>
        <div className="flex gap-1.5">
          <Button type="submit" size="sm" className="h-7 text-xs flex-1" disabled={action.loading}>
            {action.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onDone}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </form>
    </div>
  );
}

function BookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--color-brand)" }}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
