"use client";

import { useState } from "react";
import { ExternalLink, AlertCircle, CheckCircle, XCircle } from "lucide-react";
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
  let borderColor = "#E5E5E5";
  let badgeLabel = "";

  if (status === "done") {
    borderColor = "#16A34A";
    badgeLabel = "Done";
  } else if (status === "partial") {
    borderColor = "#D97706";
    badgeLabel = "Partial";
  } else if (status === "not_done") {
    borderColor = "#DC2626";
    badgeLabel = "Not done";
  } else if (status === "unlogged") {
    borderColor = "#EA580C";
    badgeLabel = "Unlogged";
  } else if (status === "cancelled") {
    borderColor = "#A3A3A3";
    badgeLabel = "Cancelled";
  } else if (isBufferPeriod) {
    borderColor = "#E5E5E5";
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
        className={`rounded-lg border p-3 ${
          isCancelled ? "opacity-60 bg-muted" : "bg-card"
        }`}
        style={{ borderLeft: `4px solid ${borderColor}` }}
      >
        {/* Header with badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <div className="text-xs font-medium text-muted-foreground">
              Period {periodNumber} • {timeLabel}
            </div>
          </div>
          {badgeLabel && (
            <Badge variant="outline" className="shrink-0 text-xs">
              {badgeLabel}
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
          <div
            className="mb-2 rounded px-2 py-1 italic mt-2"
            style={{ fontSize: "12px", color: "#525252", backgroundColor: "#F5F5F5" }}
          >
            {periodInstance.coverage_note}
          </div>
        )}

        {/* Logged time */}
        {isLogged && periodInstance.logged_at && (
          <div className="mb-3 text-xs" style={{ color: "#A3A3A3" }}>
            Logged at {new Date(periodInstance.logged_at).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </div>
        )}

        {/* Action buttons */}
        {!isCancelled && (
          <div className="flex gap-2">
            {chapterPeriod && chapterPeriod.is_published && chapterPeriod.lesson_plan_url && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleViewLesson}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View plan
              </Button>
            )}

            {userCanLog && canLog && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => setIsLogModalOpen(true)}
              >
                Log period
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
