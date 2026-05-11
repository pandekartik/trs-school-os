"use client";

import { useState, useRef } from "react";
import {
  Chapter, ChapterPeriod, ChapterMcq, ChapterTest,
  AcademicSegment, Subject, Teacher,
} from "@/lib/types";
import {
  saveChapterPeriod, togglePeriodPublish,
  updateChapterPeriodFile, saveMcq, saveTest,
} from "@/lib/actions/setup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Save, Upload, FileText,
  Eye, EyeOff, Hash, Clock, Download,
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface ContentEditorProps {
  chapter: Chapter;
  periods: ChapterPeriod[];
  mcq: ChapterMcq | null;
  test: ChapterTest | null;
  segments: AcademicSegment[];
  subjects: Subject[];
  teachers: Teacher[];
}

export function ContentEditor({
  chapter, periods, mcq, test, segments, subjects,
}: ContentEditorProps) {
  const { user } = useUser();
  const [savingPeriod, setSavingPeriod] = useState<number | null>(null);
  const [uploadingPeriod, setUploadingPeriod] = useState<number | null>(null);
  const [savingMcq, setSavingMcq] = useState(false);
  const [savingTest, setSavingTest] = useState(false);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const segment = segments.find((s) => s.id === chapter.academic_segment_id);
  const subject = subjects.find((s) => s.id === chapter.subject_id);

  // Build period slots from 1 to allocated_periods
  const periodSlots = Array.from(
    { length: chapter.allocated_periods },
    (_, i) => i + 1
  );

  async function handleSavePeriodTitle(periodNumber: number, title: string) {
    setSavingPeriod(periodNumber);
    const fd = new FormData();
    fd.append("chapter_id", chapter.id);
    fd.append("period_number", String(periodNumber));
    fd.append("title", title);
    fd.append("uploaded_by", user?.id ?? "");
    const result = await saveChapterPeriod(fd);
    if (result?.error) toast.error("Save failed", { description: result.error });
    else toast.success(`Period ${periodNumber} saved`);
    setSavingPeriod(null);
  }

  async function handleFileUpload(periodNumber: number, file: File) {
    setUploadingPeriod(periodNumber);
    try {
      // First ensure the period row exists
      const fd = new FormData();
      fd.append("chapter_id", chapter.id);
      fd.append("period_number", String(periodNumber));
      fd.append("uploaded_by", user?.id ?? "");
      await saveChapterPeriod(fd);

      // Upload the file
      const uploadFd = new FormData();
      uploadFd.append("file", file);
      uploadFd.append("chapter_id", chapter.id);
      uploadFd.append("period_number", String(periodNumber));

      const res = await fetch("/api/upload-lesson-plan", {
        method: "POST",
        body: uploadFd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Find period id
      const period = periods.find((p) => p.period_number === periodNumber);
      if (period) {
        await updateChapterPeriodFile(
          period.id, data.url, data.filename, data.file_type
        );
      }
      toast.success(`Period ${periodNumber} — file uploaded`);
    } catch (e: any) {
      toast.error("Upload failed", { description: e.message });
    } finally {
      setUploadingPeriod(null);
    }
  }

  async function handleTogglePublish(period: ChapterPeriod) {
    const result = await togglePeriodPublish(period.id, !period.is_published);
    if (result?.error) toast.error("Failed", { description: result.error });
    else toast.success(period.is_published ? "Unpublished" : "Published");
  }

  async function handleSaveMcq(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingMcq(true);
    const fd = new FormData(e.currentTarget);
    const result = await saveMcq(fd);
    if (result?.error) toast.error("Save failed", { description: result.error });
    else toast.success("MCQs saved");
    setSavingMcq(false);
  }

  async function handleSaveTest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingTest(true);
    const fd = new FormData(e.currentTarget);
    const result = await saveTest(fd);
    if (result?.error) toast.error("Save failed", { description: result.error });
    else toast.success("Test saved");
    setSavingTest(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chapter header */}
      <div className="px-6 py-4 border-b shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {subject && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 px-2 font-medium"
                  style={{ color: "var(--color-brand)", borderColor: "var(--color-brand)" }}
                >
                  {subject.name}
                </Badge>
              )}
              {segment && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 px-2 font-normal"
                  style={{
                    color: segment.segment_type === "unit" ? "#185FA5" : "#3B6D11",
                    borderColor: segment.segment_type === "unit" ? "#b5d4f4" : "#c0dd97",
                    background: segment.segment_type === "unit" ? "#e6f1fb" : "#eaf3de",
                  }}
                >
                  {segment.name}
                </Badge>
              )}
            </div>
            <h2 className="text-base font-semibold">
              Ch {chapter.chapter_number} — {chapter.name}
            </h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {chapter.allocated_periods} periods allocated
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {chapter.effective_periods} effective (20% buffer)
              </span>
              {chapter.comments && (
                <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[10px]">
                  {chapter.comments}
                </span>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-right shrink-0">
            <div className="font-medium text-foreground">
              {periods.filter((p) => p.lesson_plan_url).length} / {chapter.allocated_periods}
            </div>
            <div>files uploaded</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="periods" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-4 shrink-0">
          <TabsList>
            <TabsTrigger value="periods">
              Lesson plans ({periods.filter((p) => p.lesson_plan_url).length}/{chapter.allocated_periods})
            </TabsTrigger>
            <TabsTrigger value="mcqs">
              MCQs {mcq ? "✓" : ""}
            </TabsTrigger>
            <TabsTrigger value="test">
              Test {test ? "✓" : ""}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Periods tab */}
        <TabsContent value="periods" className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-3">
            {periodSlots.map((num) => {
              const period = periods.find((p) => p.period_number === num);
              const isUploading = uploadingPeriod === num;
              const isSaving = savingPeriod === num;

              return (
                <div
                  key={num}
                  className={cn(
                    "border rounded-xl p-4 transition-colors",
                    period?.lesson_plan_url
                      ? "bg-green-50/50 border-green-200"
                      : "bg-secondary/30 border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: period?.lesson_plan_url
                            ? "#dcfce7"
                            : "var(--color-brand-light)",
                          color: period?.lesson_plan_url
                            ? "#16a34a"
                            : "var(--color-brand)",
                        }}
                      >
                        {num}
                      </div>
                      <div>
                        <div className="text-xs font-medium">
                          Period {num} of {chapter.allocated_periods}
                        </div>
                        {period?.lesson_plan_filename && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <FileText className="h-2.5 w-2.5" />
                            {period.lesson_plan_filename}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-1 justify-end flex-wrap">
                      {/* Title input */}
                      <Input
                        placeholder="Period title (optional)"
                        defaultValue={period?.title ?? ""}
                        className="h-8 text-xs max-w-[200px]"
                        onBlur={async (e) => {
                          if (e.target.value !== (period?.title ?? "")) {
                            await handleSavePeriodTitle(num, e.target.value);
                          }
                        }}
                      />

                      {/* File upload */}
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
                        className="h-8 text-xs gap-1.5"
                        disabled={isUploading}
                        onClick={() => fileInputRefs.current[num]?.click()}
                      >
                        {isUploading
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <Upload className="h-3 w-3" />
                        }
                        {isUploading ? "Uploading..." : period?.lesson_plan_url ? "Replace" : "Upload"}
                      </Button>

                      {/* Download */}
                      {period?.lesson_plan_url && (
                        
                          href={period.lesson_plan_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5">
                            <Download className="h-3 w-3" />
                            View
                          </Button>
                        </a>
                      )}

                      {/* Publish toggle */}
                      {period && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-8 text-xs gap-1.5",
                            period.is_published
                              ? "text-green-700 hover:text-green-800"
                              : "text-muted-foreground"
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

        {/* MCQs tab */}
        <TabsContent value="mcqs" className="flex-1 overflow-y-auto px-6 py-4">
          <form onSubmit={handleSaveMcq} className="flex flex-col gap-3">
            <input type="hidden" name="chapter_id" value={chapter.id} />
            <input type="hidden" name="uploaded_by" value={user?.id ?? ""} />
            <div className="flex items-center justify-between">
              <Label>MCQ set — {chapter.name}</Label>
              <span className="text-xs text-muted-foreground">
                {Array.isArray(mcq?.mcq_set_json) ? mcq.mcq_set_json.length : 0} questions saved
              </span>
            </div>
            <div className="px-3 py-2 rounded-lg bg-secondary/50 border text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">JSON format</p>
              <pre className="text-[11px] leading-relaxed overflow-auto">{`[{"question":"...","options":["A","B","C","D"],"answer":0,"difficulty":"easy","explanation":"..."}]`}</pre>
            </div>
            <textarea
              name="mcq_set_json"
              defaultValue={mcq?.mcq_set_json ? JSON.stringify(mcq.mcq_set_json, null, 2) : ""}
              placeholder="Paste MCQ JSON array here..."
              className="resize-none rounded-lg border p-3 text-xs font-mono focus:outline-none focus:border-[color:var(--color-brand)]"
              style={{ minHeight: "300px", background: "var(--color-background)" }}
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" className="h-8 gap-1.5" disabled={savingMcq}>
                {savingMcq
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</>
                  : <><Save className="h-3.5 w-3.5" />Save MCQs</>
                }
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Test tab */}
        <TabsContent value="test" className="flex-1 overflow-y-auto px-6 py-4">
          <form onSubmit={handleSaveTest} className="flex flex-col gap-3">
            <input type="hidden" name="chapter_id" value={chapter.id} />
            <input type="hidden" name="uploaded_by" value={user?.id ?? ""} />
            <div className="flex items-center justify-between">
              <Label>Chapter test — {chapter.name}</Label>
              <span className="text-xs text-muted-foreground">
                {test ? "Test saved" : "No test yet"}
              </span>
            </div>
            <div className="px-3 py-2 rounded-lg bg-secondary/50 border text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">JSON format</p>
              <pre className="text-[11px] leading-relaxed overflow-auto">{`{"title":"...","max_marks":25,"sections":[{"type":"mcq","questions":[...]},{"type":"short","questions":[...]}]}`}</pre>
            </div>
            <textarea
              name="test_json"
              defaultValue={test?.test_json ? JSON.stringify(test.test_json, null, 2) : ""}
              placeholder="Paste test JSON here..."
              className="resize-none rounded-lg border p-3 text-xs font-mono focus:outline-none focus:border-[color:var(--color-brand)]"
              style={{ minHeight: "300px", background: "var(--color-background)" }}
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" className="h-8 gap-1.5" disabled={savingTest}>
                {savingTest
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</>
                  : <><Save className="h-3.5 w-3.5" />Save test</>
                }
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}