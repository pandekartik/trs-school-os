"use client";

import { useState } from "react";
import { Standard, Subject, Term, Unit, Chapter, ContentPackage } from "@/lib/types";
import { createUnit, deleteUnit, createChapter, deleteChapter } from "@/lib/actions/setup";
import { useAction } from "@/lib/hooks/use-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChevronRight, ChevronDown, BookOpen,
  FileText, Plus, Trash2, Circle, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ContentTreeProps {
  terms: Term[];
  standards: Standard[];
  subjects: Subject[];
  units: Unit[];
  chapters: Chapter[];
  contentPackages: ContentPackage[];
  selectedChapterId: string | null;
  onSelectChapter: (id: string) => void;
}

export function ContentTree({
  terms, standards, subjects, units, chapters,
  contentPackages, selectedChapterId, onSelectChapter,
}: ContentTreeProps) {
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [addUnitFor, setAddUnitFor] = useState<string | null>(null);
  const [addChapterFor, setAddChapterFor] = useState<string | null>(null);
  const [selectedTermForUnit, setSelectedTermForUnit] = useState<string>("");

  const unitAction = useAction(createUnit, {
    successMessage: "Unit created",
    onSuccess: () => setAddUnitFor(null),
  });

  const chapterAction = useAction(createChapter, {
    successMessage: "Chapter created",
    onSuccess: () => setAddChapterFor(null),
  });

  function toggleSubject(id: string) {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleUnit(id: string) {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleDeleteUnit(id: string) {
    const result = await deleteUnit(id);
    if (result?.error) toast.error("Delete failed", { description: result.error });
    else toast.success("Unit deleted");
  }

  async function handleDeleteChapter(id: string) {
    const result = await deleteChapter(id);
    if (result?.error) toast.error("Delete failed", { description: result.error });
    else toast.success("Chapter deleted");
  }

  const hasContent = (chapterId: string) =>
    contentPackages.some((cp) => cp.chapter_id === chapterId);

  const isPublished = (chapterId: string) =>
    contentPackages.find((cp) => cp.chapter_id === chapterId)?.is_published ?? false;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Content tree
        </span>
        <span className="text-xs text-muted-foreground">
          {chapters.length} chapters
        </span>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {subjects.length === 0 ? (
          <div className="px-4 py-6 text-xs text-muted-foreground text-center">
            No subjects with chapters found.
            <br />Add subjects in Academic Setup first.
          </div>
        ) : (
          subjects.map((subject) => {
            const std = standards.find((s) => s.id === subject.standard_id);
            const subjectUnits = units.filter((u) => u.subject_id === subject.id);
            const isExpanded = expandedSubjects.has(subject.id);

            return (
              <div key={subject.id}>
                {/* Subject row */}
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-secondary/50 group"
                  onClick={() => toggleSubject(subject.id)}
                >
                  {isExpanded
                    ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  }
                  <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-brand)" }} />
                  <span className="text-xs font-semibold flex-1 truncate">{subject.name}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{std?.name}</span>

                  {/* Add unit button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddUnitFor(subject.id);
                      setSelectedTermForUnit(terms[0]?.id ?? "");
                    }}
                    title="Add unit"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Add unit dialog */}
                {addUnitFor === subject.id && (
                  <div className="mx-3 my-1 p-3 rounded-lg border bg-secondary/40">
                    <form
                      ref={unitAction.formRef}
                      action={unitAction.execute}
                      className="flex flex-col gap-2"
                    >
                      <input type="hidden" name="subject_id" value={subject.id} />
                      <div className="flex flex-col gap-1">
                        <Label>Term</Label>
                        <Select
                          value={selectedTermForUnit}
                          onValueChange={setSelectedTermForUnit}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Select term" />
                          </SelectTrigger>
                          <SelectContent>
                            {terms.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <input type="hidden" name="term_id" value={selectedTermForUnit} />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="flex flex-col gap-1">
                          <Label>Name</Label>
                          <Input name="name" placeholder="Unit 1" className="h-7 text-xs" required />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label>Number</Label>
                          <Input name="unit_number" type="number" min="1" placeholder="1" className="h-7 text-xs" required />
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <Button type="submit" size="sm" className="h-7 text-xs flex-1" disabled={unitAction.loading}>
                          Add
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setAddUnitFor(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Units */}
                {isExpanded && subjectUnits.map((unit) => {
                  const unitChapters = chapters.filter((c) => c.unit_id === unit.id);
                  const isUnitExpanded = expandedUnits.has(unit.id);

                  return (
                    <div key={unit.id}>
                      {/* Unit row */}
                      <div
                        className="flex items-center gap-1.5 pl-7 pr-3 py-1.5 cursor-pointer hover:bg-secondary/50 group"
                        onClick={() => toggleUnit(unit.id)}
                      >
                        {isUnitExpanded
                          ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                          : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        }
                        <span className="text-xs font-medium flex-1 truncate text-muted-foreground">
                          {unit.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {unitChapters.length} ch
                        </span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddChapterFor(unit.id);
                            }}
                            title="Add chapter"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUnit(unit.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Add chapter inline form */}
                      {addChapterFor === unit.id && (
                        <div className="mx-3 ml-9 my-1 p-3 rounded-lg border bg-secondary/40">
                          <form
                            ref={chapterAction.formRef}
                            action={chapterAction.execute}
                            className="flex flex-col gap-2"
                          >
                            <input type="hidden" name="unit_id" value={unit.id} />
                            <div className="flex flex-col gap-1">
                              <Label>Chapter name</Label>
                              <Input name="name" placeholder="e.g. My Family and Me" className="h-7 text-xs" required />
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              <div className="flex flex-col gap-1">
                                <Label>Chapter #</Label>
                                <Input name="chapter_number" type="number" min="1" placeholder="1" className="h-7 text-xs" required />
                              </div>
                              <div className="flex flex-col gap-1">
                                <Label>Periods</Label>
                                <Input name="allocated_periods" type="number" min="1" placeholder="7" className="h-7 text-xs" required />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label>Comments (optional)</Label>
                              <Input name="comments" placeholder="e.g. PROJECT, ORAL" className="h-7 text-xs" />
                            </div>
                            <div className="flex gap-1.5">
                              <Button type="submit" size="sm" className="h-7 text-xs flex-1" disabled={chapterAction.loading}>
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
                      {isUnitExpanded && unitChapters.map((chapter) => {
                        const published = isPublished(chapter.id);
                        const hasC = hasContent(chapter.id);
                        const isSelected = selectedChapterId === chapter.id;

                        return (
                          <div
                            key={chapter.id}
                            className={cn(
                              "flex items-center gap-1.5 pl-12 pr-3 py-1.5 cursor-pointer group transition-colors",
                              isSelected
                                ? "bg-[#fce8ea]"
                                : "hover:bg-secondary/50"
                            )}
                            onClick={() => onSelectChapter(chapter.id)}
                          >
                            {published
                              ? <CheckCircle2 className="h-3 w-3 shrink-0 text-green-600" />
                              : hasC
                                ? <Circle className="h-3 w-3 shrink-0 text-amber-500" />
                                : <Circle className="h-3 w-3 shrink-0 text-muted-foreground/30" />
                            }
                            <FileText
                              className="h-3 w-3 shrink-0"
                              style={{ color: isSelected ? "var(--color-brand)" : "var(--color-text-secondary)" }}
                            />
                            <span
                              className={cn(
                                "text-xs flex-1 truncate",
                                isSelected ? "font-medium" : ""
                              )}
                              style={{ color: isSelected ? "var(--color-brand)" : "var(--color-foreground)" }}
                            >
                              {chapter.chapter_number}. {chapter.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {chapter.allocated_periods}p
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
            );
          })
        )}
      </div>
    </div>
  );
}