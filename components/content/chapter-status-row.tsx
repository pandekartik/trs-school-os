"use client";

import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Chapter } from "@/lib/types";

type ChapterStatus = "not_started" | "in_progress" | "complete";

type ChapterStatusRowProps = {
  chapter: Chapter;
  status: ChapterStatus;
  uploadedCount: number;
  publishedCount: number;
  selected?: boolean;
  onSelect: () => void;
};

const statusConfig: Record<
  ChapterStatus,
  { label: string; className: string; tone: string }
> = {
  not_started: {
    label: "Pending",
    className: "border-slate-200 bg-slate-50 text-slate-600",
    tone: "0 files uploaded",
  },
  in_progress: {
    label: "In Progress",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    tone: "Some files uploaded",
  },
  complete: {
    label: "Complete",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    tone: "All published",
  },
};

export function ChapterStatusRow({
  chapter,
  status,
  uploadedCount,
  publishedCount,
  selected = false,
  onSelect,
}: ChapterStatusRowProps) {
  const config = statusConfig[status];
  const progressPct = chapter.allocated_periods > 0
    ? Math.min((uploadedCount / chapter.allocated_periods) * 100, 100)
    : 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border text-left transition-colors",
        selected
          ? "border-[#ba2032] bg-[#fce8ea] shadow-[inset_3px_0_0_0_#ba2032]"
          : "border-border bg-card hover:bg-secondary/40"
      )}
    >
      <div className="flex items-center gap-3 px-3 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn(
              "text-xs font-semibold truncate",
              selected ? "text-[#ba2032]" : "text-foreground"
            )}>
              Ch {chapter.chapter_number}. {chapter.name}
            </span>
          </div>
          <div className="mt-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-[#ba2032] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
              <span>
                {uploadedCount}/{chapter.allocated_periods} uploaded
              </span>
              <span>
                {publishedCount}/{chapter.allocated_periods} published
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline" className={cn("h-5 border px-2 text-[10px] font-normal", config.className)}>
            {config.label}
          </Badge>
          <div className="flex h-7 w-7 items-center justify-center rounded-full border bg-background text-muted-foreground">
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t px-3 py-1.5 text-[10px] text-muted-foreground">
        <span>{config.tone}</span>
        <span>{chapter.effective_periods} effective</span>
      </div>
    </button>
  );
}
