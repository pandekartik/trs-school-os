"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  AcademicSegment,
  Chapter,
  ChapterMcq,
  ChapterPeriod,
  ChapterTest,
  Subject,
} from "@/lib/types";
import {
  saveChapterPeriod,
  updateChapterPeriodFile,
  togglePeriodPublish,
  saveMcq,
  saveTest,
} from "@/lib/actions/setup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Save,
  Upload,
} from "lucide-react";

type UploadPanelProps = {
  chapter: Chapter;
  periods: ChapterPeriod[];
  mcq: ChapterMcq | null;
  test: ChapterTest | null;
  subjects: Subject[];
  segments: AcademicSegment[];
};

export function UploadPanel({
  chapter,
  periods,
  mcq,
  test,
  subjects,
  segments,
}: UploadPanelProps) {
  const router = useRouter();
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [uploadingPeriod, setUploadingPeriod] = useState<number | null>(null);
  const [savingMcq, setSavingMcq] = useState(false);
  const [savingTest, setSavingTest] = useState(false);

  const subject = subjects.find((item) => item.id === chapter.subject_id) ?? null;
  const segment = segments.find((item) => item.id === chapter.academic_segment_id) ?? null;
  const orderedPeriods = [...periods].sort((a, b) => a.period_number - b.period_number);

  async function handleTitleBlur(periodNumber: number, title: string) {
    const current = orderedPeriods.find((period) => period.period_number === periodNumber);
    if (!current && !title) return;
    if (current && (current.title ?? "") === title) return;

    const fd = new FormData();
    fd.append("chapter_id", chapter.id);
    fd.append("period_number", String(periodNumber));
    fd.append("uploaded_by", "");
    fd.append("title", title);

    const result = await saveChapterPeriod(fd);
    if (result?.error) {
      toast.error("Failed to save title", { description: result.error });
      return;
    }

    toast.success(`Period ${periodNumber} title saved`);
    router.refresh();
  }

  async function handleUpload(periodNumber: number, file: File) {
    setUploadingPeriod(periodNumber);
    try {
      const ensureFd = new FormData();
      ensureFd.append("chapter_id", chapter.id);
      ensureFd.append("period_number", String(periodNumber));
      ensureFd.append("uploaded_by", "");
      const ensureResult = await saveChapterPeriod(ensureFd);
      if (ensureResult?.error) throw new Error(ensureResult.error);

      const uploadFd = new FormData();
      uploadFd.append("file", file);
      uploadFd.append("chapter_id", chapter.id);
      uploadFd.append("period_number", String(periodNumber));

      const res = await fetch("/api/upload-lesson-plan", { method: "POST", body: uploadFd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      const chapterPeriodId = ensureResult?.chapter_period_id;
      if (chapterPeriodId) {
        const updateResult = await updateChapterPeriodFile(
          chapterPeriodId,
          data.url,
          data.filename,
          data.file_type,
        );
        if (updateResult?.error) throw new Error(updateResult.error);
      }

      toast.success(`Period ${periodNumber} uploaded`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error("Upload failed", { description: message });
    } finally {
      setUploadingPeriod(null);
    }
  }

  async function handleTogglePublish(period: ChapterPeriod) {
    const result = await togglePeriodPublish(period.id, !period.is_published);
    if (result?.error) {
      toast.error("Publish update failed", { description: result.error });
      return;
    }

    toast.success(period.is_published ? "Unpublished" : "Published");
    router.refresh();
  }

  async function handleSaveMcq(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingMcq(true);
    try {
      const result = await saveMcq(new FormData(e.currentTarget));
      if (result?.error) {
        toast.error("MCQ save failed", { description: result.error });
        return;
      }

      toast.success("MCQs saved");
      router.refresh();
    } finally {
      setSavingMcq(false);
    }
  }

  async function handleSaveTest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingTest(true);
    try {
      const result = await saveTest(new FormData(e.currentTarget));
      if (result?.error) {
        toast.error("Test save failed", { description: result.error });
        return;
      }

      toast.success("Test saved");
      router.refresh();
    } finally {
      setSavingTest(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="border-b px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold">
              Ch {chapter.chapter_number}. {chapter.name}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {subject && (
                <Badge variant="outline" className="border-[#f0b0b7] bg-[#fce8ea] text-[#a01b2b]">
                  {subject.name}
                </Badge>
              )}
              {segment && (
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                  {segment.name}
                </Badge>
              )}
              <Badge variant="outline" className="font-normal">
                {chapter.allocated_periods} allocated
              </Badge>
              <Badge variant="outline" className="font-normal">
                {chapter.effective_periods} effective
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            Upload and track lesson plan status
          </div>
        </div>
      </div>

      <Tabs defaultValue="lesson-plans" className="flex min-h-0 flex-1 flex-col">
        <div className="border-b px-5 pt-4">
          <TabsList>
            <TabsTrigger value="lesson-plans">Lesson Plans</TabsTrigger>
            <TabsTrigger value="mcqs">MCQs {mcq ? "✓" : ""}</TabsTrigger>
            <TabsTrigger value="test">Test {test ? "✓" : ""}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="lesson-plans" className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-2">
            {Array.from({ length: chapter.allocated_periods }, (_, index) => index + 1).map((periodNumber) => {
              const period = orderedPeriods.find((item) => item.period_number === periodNumber);
              const isUploading = uploadingPeriod === periodNumber;

              return (
                <div key={periodNumber}>
                  <div
                    className={cn(
                      "rounded-xl border p-3 transition-colors",
                      period?.lesson_plan_url
                        ? period.is_published
                          ? "border-emerald-200 bg-emerald-50/40"
                          : "border-amber-200 bg-amber-50/40"
                        : "border-border bg-secondary/20"
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                        period?.lesson_plan_url
                          ? period.is_published
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {periodNumber}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <span>Period {periodNumber}</span>
                        <span className="text-muted-foreground">
                          of {chapter.allocated_periods}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {period?.lesson_plan_filename ?? "No file uploaded yet"}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Title
                        </Label>
                        <Input
                          defaultValue={period?.title ?? ""}
                          className="h-7 w-40 text-xs"
                          placeholder="Period title"
                          onBlur={(e) => handleTitleBlur(periodNumber, e.target.value.trim())}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Upload
                        </Label>
                        <div className="flex items-center gap-2">
                          <input
                            ref={(el) => { fileInputRefs.current[periodNumber] = el; }}
                            type="file"
                            accept=".pdf,.docx,.doc"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              e.target.value = "";
                              if (file) await handleUpload(periodNumber, file);
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1.5 text-xs"
                            onClick={() => fileInputRefs.current[periodNumber]?.click()}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Upload className="h-3.5 w-3.5" />
                            )}
                            {period?.lesson_plan_url ? "Replace" : "Upload"}
                          </Button>
                        </div>
                      </div>

                      {period?.lesson_plan_url && (
                        <div className="flex flex-col gap-1">
                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            View
                          </Label>
                          <a href={period.lesson_plan_url} target="_blank" rel="noreferrer">
                            <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
                              <FileText className="h-3.5 w-3.5" />
                              Open
                            </Button>
                          </a>
                        </div>
                      )}

                      {period?.lesson_plan_url && (
                        <div className="flex flex-col gap-1">
                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Publish
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-7 gap-1.5 text-xs",
                              period.is_published ? "text-emerald-700" : "text-muted-foreground"
                            )}
                            onClick={() => handleTogglePublish(period)}
                          >
                            {period.is_published ? (
                              <>
                                <Eye className="h-3.5 w-3.5" />
                                Published
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3.5 w-3.5" />
                                Draft
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                  {isUploading && (
                    <div className="h-1 bg-muted rounded-b-lg overflow-hidden">
                      <style>{`
                        @keyframes upload-progress {
                          0% { width: 0%; }
                          100% { width: 100%; }
                        }
                        .upload-progress-bar {
                          height: 100%;
                          background: linear-gradient(90deg, #ba2032, #dc2626);
                          animation: upload-progress 3s ease-out forwards;
                        }
                      `}</style>
                      <div className="upload-progress-bar" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="mcqs" className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <form onSubmit={handleSaveMcq} className="flex flex-col gap-3">
            <input type="hidden" name="chapter_id" value={chapter.id} />
            <input type="hidden" name="uploaded_by" value="" />

            <div className="flex items-center justify-between gap-3">
              <Label>MCQ set</Label>
              <span className="text-xs text-muted-foreground">
                {Array.isArray(mcq?.mcq_set_json) ? mcq.mcq_set_json.length : 0} questions saved
              </span>
            </div>

            <details className="rounded-lg border bg-secondary/30 px-3 py-2 text-xs">
              <summary className="cursor-pointer font-medium">Format reference</summary>
              <pre className="mt-2 overflow-auto text-[11px] text-muted-foreground">{`[{"question":"...","options":["A","B","C","D"],"answer":0,"difficulty":"easy","explanation":"..."}]`}</pre>
            </details>

            <textarea
              name="mcq_set_json"
              defaultValue={mcq?.mcq_set_json ? JSON.stringify(mcq.mcq_set_json, null, 2) : ""}
              className="min-h-[320px] resize-none rounded-lg border p-3 text-xs font-mono focus:border-[color:var(--color-brand)] focus:outline-none"
              placeholder="Paste MCQ JSON array..."
            />

            <div className="flex justify-end">
              <Button type="submit" size="sm" className="h-8 gap-1.5 text-xs" disabled={savingMcq}>
                {savingMcq ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Save MCQs
                  </>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="test" className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <form onSubmit={handleSaveTest} className="flex flex-col gap-3">
            <input type="hidden" name="chapter_id" value={chapter.id} />
            <input type="hidden" name="uploaded_by" value="" />

            <div className="flex items-center justify-between gap-3">
              <Label>Chapter test</Label>
              <span className="text-xs text-muted-foreground">
                {test ? "Test saved" : "Not created yet"}
              </span>
            </div>

            <textarea
              name="test_json"
              defaultValue={test?.test_json ? JSON.stringify(test.test_json, null, 2) : ""}
              className="min-h-[320px] resize-none rounded-lg border p-3 text-xs font-mono focus:border-[color:var(--color-brand)] focus:outline-none"
              placeholder='{"title":"...","max_marks":25,"sections":[...]}'
            />

            <div className="flex justify-end">
              <Button type="submit" size="sm" className="h-8 gap-1.5 text-xs" disabled={savingTest}>
                {savingTest ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Save Test
                  </>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
