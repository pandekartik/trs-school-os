"use client";

import { useState } from "react";
import { Chapter, ContentPackage, Unit, Subject } from "@/lib/types";
import { saveContentPackage, togglePublishContent } from "@/lib/actions/setup";
import { useAction } from "@/lib/hooks/use-action";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Eye, EyeOff, BookOpen, Clock, Hash } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

interface ContentEditorProps {
  chapter: Chapter;
  content: ContentPackage | null;
  units: Unit[];
  subjects: Subject[];
  teachers: { id: string; name: string }[];
}

export function ContentEditor({
  chapter, content, units, subjects, teachers,
}: ContentEditorProps) {
  const { user } = useUser();
  const [publishing, setPublishing] = useState(false);

  const unit = units.find((u) => u.id === chapter.unit_id);
  const subject = subjects.find((s) => s.id === unit?.subject_id);

  const saveAction = useAction(saveContentPackage, {
    successMessage: "Content saved",
  });

  async function handleTogglePublish() {
    setPublishing(true);
    const result = await togglePublishContent(chapter.id, !content?.is_published);
    if (result?.error) toast.error("Failed", { description: result.error });
    else toast.success(content?.is_published ? "Unpublished" : "Published");
    setPublishing(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chapter header */}
      <div className="px-6 py-4 border-b">
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
              {unit && (
                <Badge variant="outline" className="text-[10px] h-5 px-2 font-normal">
                  {unit.name}
                </Badge>
              )}
              {content?.is_published && (
                <Badge className="text-[10px] h-5 px-2 bg-green-100 text-green-700 border border-green-200">
                  Published
                </Badge>
              )}
              {content && !content.is_published && (
                <Badge variant="outline" className="text-[10px] h-5 px-2 text-amber-600 border-amber-300">
                  Draft
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
                {chapter.effective_periods} effective (after 20% buffer)
              </span>
              {chapter.comments && (
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {chapter.comments}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={handleTogglePublish}
              disabled={publishing || !content}
            >
              {publishing
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : content?.is_published
                  ? <EyeOff className="h-3.5 w-3.5" />
                  : <Eye className="h-3.5 w-3.5" />
              }
              {content?.is_published ? "Unpublish" : "Publish"}
            </Button>
          </div>
        </div>
      </div>

      {/* Content tabs */}
      <div className="flex-1 overflow-y-auto">
        <form ref={saveAction.formRef} action={saveAction.execute} className="h-full">
          <input type="hidden" name="chapter_id" value={chapter.id} />
          <input type="hidden" name="uploaded_by" value={user?.id ?? ""} />

          <Tabs defaultValue="lesson-plan" className="h-full flex flex-col">
            <div className="px-6 pt-4 pb-0">
              <TabsList>
                <TabsTrigger value="lesson-plan">Lesson plan</TabsTrigger>
                <TabsTrigger value="mcqs">MCQs</TabsTrigger>
                <TabsTrigger value="notes">Reference notes</TabsTrigger>
              </TabsList>
            </div>

            {/* Lesson Plan */}
            <TabsContent value="lesson-plan" className="flex-1 px-6 py-4">
              <div className="flex flex-col gap-2 h-full">
                <div className="flex items-center justify-between">
                  <Label>Lesson plan</Label>
                  <span className="text-xs text-muted-foreground">
                    Supports markdown formatting
                  </span>
                </div>
                <textarea
                  name="lesson_plan_body"
                  defaultValue={content?.lesson_plan_body ?? ""}
                  placeholder={`Write the lesson plan for "${chapter.name}"...\n\nYou can structure it as:\n## Learning Objectives\n- Objective 1\n\n## Period-wise Breakdown\n### Period 1\n- Topic: Introduction\n- Activity: ...\n\n## Materials Needed\n- Textbook page X`}
                  className="flex-1 resize-none rounded-lg border p-3 text-sm font-mono leading-relaxed focus:outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand)]/10"
                  style={{ minHeight: "400px", background: "var(--color-background)" }}
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm" className="h-8 gap-1.5" disabled={saveAction.loading}>
                    {saveAction.loading
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</>
                      : <><Save className="h-3.5 w-3.5" />Save lesson plan</>
                    }
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* MCQs */}
            <TabsContent value="mcqs" className="flex-1 px-6 py-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label>MCQ set</Label>
                  <span className="text-xs text-muted-foreground">
                    Paste JSON array or use the format below
                  </span>
                </div>

                {content?.mcq_set_json ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                      <span className="text-xs text-green-700 font-medium">
                        ✓ {Array.isArray(content.mcq_set_json) ? content.mcq_set_json.length : 0} MCQs saved
                      </span>
                    </div>
                    <MCQList mcqs={content.mcq_set_json} />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="px-3 py-2 rounded-lg bg-secondary/50 border text-xs text-muted-foreground">
                      <p className="font-medium mb-1">Expected JSON format:</p>
                      <pre className="text-[11px] leading-relaxed">{`[
  {
    "question": "What is a nuclear family?",
    "options": ["A", "B", "C", "D"],
    "answer": 0,
    "difficulty": "easy",
    "explanation": "..."
  }
]`}</pre>
                    </div>
                    <textarea
                      name="mcq_set_json"
                      placeholder="Paste MCQ JSON here..."
                      className="resize-none rounded-lg border p-3 text-xs font-mono focus:outline-none focus:border-[color:var(--color-brand)]"
                      style={{ minHeight: "200px", background: "var(--color-background)" }}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" size="sm" className="h-8 gap-1.5" disabled={saveAction.loading}>
                        {saveAction.loading
                          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</>
                          : <><Save className="h-3.5 w-3.5" />Save MCQs</>
                        }
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Reference notes */}
            <TabsContent value="notes" className="flex-1 px-6 py-4">
              <div className="flex flex-col gap-2">
                <Label>Reference notes</Label>
                <textarea
                  name="reference_notes"
                  defaultValue={content?.reference_notes ?? ""}
                  placeholder="Add any reference notes, additional material, or links for this chapter..."
                  className="resize-none rounded-lg border p-3 text-sm focus:outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand)]/10"
                  style={{ minHeight: "300px", background: "var(--color-background)" }}
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm" className="h-8 gap-1.5" disabled={saveAction.loading}>
                    {saveAction.loading
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</>
                      : <><Save className="h-3.5 w-3.5" />Save notes</>
                    }
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </div>
  );
}

function MCQList({ mcqs }: { mcqs: any[] }) {
  if (!Array.isArray(mcqs)) return null;

  return (
    <div className="flex flex-col gap-2">
      {mcqs.map((mcq, i) => (
        <div key={i} className="border rounded-lg p-3 bg-secondary/30">
          <p className="text-xs font-medium mb-2">
            {i + 1}. {mcq.question}
          </p>
          <div className="grid grid-cols-2 gap-1">
            {mcq.options?.map((opt: string, j: number) => (
              <div
                key={j}
                className={cn(
                  "text-xs px-2 py-1 rounded",
                  j === mcq.answer
                    ? "bg-green-100 text-green-700 font-medium"
                    : "bg-secondary/50 text-muted-foreground"
                )}
              >
                {String.fromCharCode(65 + j)}. {opt}
              </div>
            ))}
          </div>
          {mcq.explanation && (
            <p className="text-[11px] text-muted-foreground mt-2 pt-2 border-t">
              {mcq.explanation}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}