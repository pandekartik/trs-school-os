"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";

interface ChapterProgressProps {
  chapters: any[];
  academicSegments: any[];
  standards: any[];
  subjects: any[];
  periodInstancesThisWeek: any[];
}

export function ChapterProgress({
  chapters,
  academicSegments,
  standards,
  subjects,
  periodInstancesThisWeek,
}: ChapterProgressProps) {
  const [expandedStandard, setExpandedStandard] = useState<string | null>(
    standards[0]?.id || null
  );

  // Build lookups
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const segmentMap = new Map(academicSegments.map((s) => [s.id, s]));
  const standardMap = new Map(standards.map((s) => [s.id, s]));

  // Group chapters by standard and subject
  const groupChaptersByStandard = () => {
    const grouped: Record<string, Record<string, any[]>> = {};

    standards.forEach((std) => {
      grouped[std.id] = {};
      subjects.forEach((subject) => {
        if (subject.standard_id === std.id) {
          grouped[std.id][subject.id] = chapters.filter(
            (ch) => ch.subject_id === subject.id
          );
        }
      });
    });

    return grouped;
  };

  const getChapterStatus = (chapter: any): "not_started" | "in_progress" | "completed" => {
    const chapterPeriods = periodInstancesThisWeek.filter(
      (p) => p.chapter_id === chapter.id && !p.is_buffer
    );

    if (chapterPeriods.length === 0) return "not_started";

    const completedOrPartial = chapterPeriods.filter(
      (p) => p.status === "done" || p.status === "partial"
    ).length;

    if (completedOrPartial === chapterPeriods.length) return "completed";
    return "in_progress";
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in_progress":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      default:
        return "Not Started";
    }
  };

  const grouped = groupChaptersByStandard();

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4">Chapter Progress</h3>

      <div className="space-y-2">
        {standards.map((standard) => (
          <div key={standard.id} className="border rounded-lg">
            {/* Standard header */}
            <button
              onClick={() =>
                setExpandedStandard(
                  expandedStandard === standard.id ? null : standard.id
                )
              }
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition text-left"
            >
              <span className="font-semibold">
                {standard.name} (Grade {standard.grade})
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  expandedStandard === standard.id ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Expanded content */}
            {expandedStandard === standard.id && (
              <div className="border-t px-4 py-3 space-y-4 bg-muted/30">
                {Object.entries(grouped[standard.id] || {}).map(
                  ([subjectId, subjectChapters]) => {
                    const subject = subjectMap.get(subjectId);
                    if (!subject || subjectChapters.length === 0) return null;

                    return (
                      <div key={subjectId}>
                        <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                          {subject.name}
                        </h4>
                        <div className="space-y-2">
                          {(subjectChapters as any[]).map((chapter) => {
                            const status = getChapterStatus(chapter);
                            const chapterPeriods = periodInstancesThisWeek.filter(
                              (p) => p.chapter_id === chapter.id && !p.is_buffer
                            );
                            const donePeriods = chapterPeriods.filter(
                              (p) => p.status === "done" || p.status === "partial"
                            ).length;

                            return (
                              <div
                                key={chapter.id}
                                className="text-sm p-3 bg-white border rounded-lg"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <p className="font-medium">
                                      Ch {chapter.number}. {chapter.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Allocated: {chapter.allocated_periods} periods •{" "}
                                      {chapter.effective_periods || chapter.allocated_periods}{" "}
                                      effective
                                    </p>
                                  </div>
                                  <Badge className={getStatusColor(status)}>
                                    {getStatusLabel(status)}
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-4 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">Progress: </span>
                                    <span className="font-semibold">
                                      {donePeriods} of {chapterPeriods.length} periods
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
