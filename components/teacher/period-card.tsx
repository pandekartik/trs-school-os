"use client";

import { useState } from "react";
import { Download, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogModal } from "@/components/teacher/log-modal";
import { PERIOD_TIMES, formatTimeLabel } from "@/lib/timetable-constants";

interface PeriodCardProps {
  periodInstance: any;
  slot: any;
  chapter: any;
  chapterPeriod: any;
  subject: any;
  standard: any;
  division: any;
  isTeacher: boolean;
  canLog: boolean;
  loggedBy: string;
}

export function PeriodCard({
  periodInstance,
  slot,
  chapter,
  chapterPeriod,
  subject,
  standard,
  division,
  isTeacher,
  canLog: userCanLog,
  loggedBy,
}: PeriodCardProps) {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  if (!slot || !subject) return null;

  const periodNumber = slot.period_number;
  const status = periodInstance.status;
  const isBufferPeriod = periodInstance.is_buffer;

  // Determine card border and badge based on status
  let borderClass = "border-l-4 border-l-gray-300";
  let badgeColor = "secondary";
  let badgeIcon: React.ReactNode = null;
  let badgeLabel = "";

  if (status === "done") {
    borderClass = "border-l-4 border-l-green-500";
    badgeColor = "default";
    badgeIcon = <CheckCircle className="w-3 h-3" />;
    badgeLabel = "✓ Done";
  } else if (status === "partial") {
    borderClass = "border-l-4 border-l-amber-500";
    badgeColor = "secondary";
    badgeIcon = <AlertCircle className="w-3 h-3" />;
    badgeLabel = "Partial";
  } else if (status === "not_done") {
    borderClass = "border-l-4 border-l-red-500";
    badgeColor = "destructive";
    badgeIcon = <XCircle className="w-3 h-3" />;
    badgeLabel = "Not done";
  } else if (status === "cancelled") {
    borderClass = "border-l-4 border-l-gray-300 border-dashed";
    badgeColor = "secondary";
    badgeLabel = "Cancelled";
  } else if (status === "unlogged") {
    borderClass = "border-l-4 border-l-orange-500";
    badgeColor = "secondary";
    badgeIcon = <AlertCircle className="w-3 h-3" />;
    badgeLabel = "⚠ Unlogged";
  } else if (isBufferPeriod) {
    borderClass = "border-l-4 border-l-gray-300 border-dashed";
    badgeColor = "secondary";
    badgeLabel = "Buffer";
  }

  const periodTime = PERIOD_TIMES.find((p) => p.period === periodNumber);
  const timeLabel = periodTime
    ? `${formatTimeLabel(periodTime.start)} - ${formatTimeLabel(periodTime.end)}`
    : "";

  const isLogged = ["done", "partial", "not_done"].includes(status);
  const canLog = (status === "scheduled" || status === "unlogged") && !isBufferPeriod;
  const isPast = new Date(periodInstance.date) < new Date();
  const isCancelled = status === "cancelled";

  const handleViewLesson = () => {
    if (chapterPeriod?.lesson_plan_url) {
      window.open(chapterPeriod.lesson_plan_url, "_blank");
    }
  };

  return (
    <>
      <div
        className={`rounded-lg border p-3 ${borderClass} ${
          isCancelled ? "opacity-60 bg-muted" : "bg-card"
        }`}
      >
        {/* Header with badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <div className="text-xs font-medium text-muted-foreground">
              Period {periodNumber} • {timeLabel}
            </div>
          </div>
          {badgeLabel && (
            <Badge variant={badgeColor as any} className="shrink-0 gap-1">
              {badgeIcon}
              <span>{badgeLabel}</span>
            </Badge>
          )}
        </div>

        {/* Subject and division */}
        <div className="mb-2">
          <div className="text-sm font-semibold text-foreground">{subject.name}</div>
          <div className="text-xs text-muted-foreground">
            {standard?.name} • {division?.name}
          </div>
        </div>

        {/* Chapter info */}
        {chapter && !isBufferPeriod && (
          <div className="mb-3 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">{chapter.name}</div>
            <div>
              Period {periodInstance.chapter_period_sequence} of {chapter.allocated_periods}
            </div>
          </div>
        )}

        {/* Substitution indicator */}
        {periodInstance.is_substituted && (
          <div className="mb-2 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
            Substituting for original teacher
          </div>
        )}

        {/* Coverage note */}
        {periodInstance.coverage_note && (
          <div className="mb-2 text-xs text-muted-foreground bg-muted rounded px-2 py-1">
            {periodInstance.coverage_note}
          </div>
        )}

        {/* Logged time */}
        {isLogged && periodInstance.logged_at && (
          <div className="mb-3 text-xs text-muted-foreground">
            Logged {new Date(periodInstance.logged_at).toLocaleDateString()}
          </div>
        )}

        {/* Action buttons */}
        {!isCancelled && (
          <div className="flex gap-2">
            {chapterPeriod?.lesson_plan_url && chapterPeriod?.is_published && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleViewLesson}
              >
                <Download className="w-3 h-3 mr-1" />
                View Plan
              </Button>
            )}

            {userCanLog && canLog && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => setIsLogModalOpen(true)}
              >
                Log Period
              </Button>
            )}

            {userCanLog && isLogged && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => setIsLogModalOpen(true)}
              >
                Edit log
              </Button>
            )}
          </div>
        )}
      </div>

      {userCanLog && (
        <LogModal
          open={isLogModalOpen}
          onOpenChange={setIsLogModalOpen}
          periodInstance={periodInstance}
          subject={subject}
          division={division}
          standard={standard}
          loggedBy={loggedBy}
        />
      )}
    </>
  );
}
