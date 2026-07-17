"use client";

import { useState } from "react";
import { ExternalLink, Settings, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogModal } from "@/components/teacher/log-modal";
import { OverrideModal } from "@/components/teacher/override-modal";
import { PERIOD_TIMES, formatTimeLabel } from "@/lib/timetable-constants";
import { parseDateOnly } from "@/lib/utils/date";

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
  periodOverride?: any;
  role?: string;
  teachers?: any[];
  chapters?: any[];
  isLive?: boolean;
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
  periodOverride,
  role = "teacher",
  teachers = [],
  chapters = [],
  isLive = false,
}: PeriodCardProps) {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    if (periodInstance.display_id) {
      navigator.clipboard.writeText(periodInstance.display_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (!slot || !subject) return null;

  const periodNumber = slot.period_number;
  const status = periodInstance.status;
  const isBufferPeriod = periodInstance.is_buffer;
  const isAdmin = role === "admin" || role === "super_admin";

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
  const isPast = parseDateOnly(periodInstance.date) < new Date();
  const isCancelled = status === "cancelled";

  const handleViewLesson = () => {
    if (chapterPeriod?.lesson_plan_url) {
      window.open(chapterPeriod.lesson_plan_url, "_blank");
    }
  };

  return (
    <>
      <div
        className={`rounded-lg border p-2 ${
          isCancelled ? "opacity-60 bg-muted" : isLive ? "bg-green-50 border-green-200" : "bg-card"
        }`}
        style={{ borderLeft: `4px solid ${isLive ? "#22c55e" : borderColor}` }}
      >
        {/* Header with badges */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1">
            <div className="text-xs font-medium text-muted-foreground">
              Period {periodNumber} • {timeLabel}
            </div>
          </div>
          <div className="flex gap-2 shrink-0 items-center">
            {periodOverride && (
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  backgroundColor:
                    periodOverride.override_type === "substitute" ? "#EFF6FF" :
                    periodOverride.override_type === "cancel" ? "#F5F5F5" :
                    periodOverride.override_type === "topic_change" ? "#FEF3C7" :
                    "#F3E8FF",
                  color:
                    periodOverride.override_type === "substitute" ? "#0369A1" :
                    periodOverride.override_type === "cancel" ? "#525252" :
                    periodOverride.override_type === "topic_change" ? "#92400E" :
                    "#6D28D9",
                  border: "none"
                }}
              >
                {periodOverride.override_type === "substitute" ? "Substitute" :
                 periodOverride.override_type === "cancel" ? "Cancelled" :
                 periodOverride.override_type === "topic_change" ? "Custom Topic" :
                 "Remapped"}
              </Badge>
            )}
            {isLive && (
              <Badge className="shrink-0 text-xs bg-green-500 text-white hover:bg-green-600">
                LIVE
              </Badge>
            )}
            {badgeLabel && (
              <Badge variant="outline" className="shrink-0 text-xs">
                {badgeLabel}
              </Badge>
            )}
          </div>
        </div>

        {/* Subject and division */}
        <div className="mb-1">
          <div className="text-sm font-semibold text-foreground leading-tight">{subject.name}</div>
          <div className="text-xs text-muted-foreground">
            {standard?.name} • {division?.name}
          </div>
        </div>

        {/* Chapter info */}
        {chapter && !isBufferPeriod && (
          <div className="mb-2 text-xs text-muted-foreground">
            <div className="font-medium text-foreground leading-tight">{chapter.name}</div>
            <div className="text-xs">
              Period {periodInstance.chapter_period_sequence} of {chapter.allocated_periods}
            </div>
          </div>
        )}

        {/* Substitution indicator */}
        {periodInstance.is_substituted && (
          <div className="mb-1 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
            Substituting
          </div>
        )}

        {/* Coverage note */}
        {periodInstance.coverage_note && (
          <div
            className="mb-1 rounded px-2 py-1 italic text-xs"
            style={{ color: "#525252", backgroundColor: "#F5F5F5" }}
          >
            {periodInstance.coverage_note}
          </div>
        )}

        {/* Logged time */}
        {isLogged && periodInstance.logged_at && (
          <div className="mb-1 text-xs" style={{ color: "#A3A3A3" }}>
            Logged {new Date(periodInstance.logged_at).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </div>
        )}

        {/* Action buttons */}
        {!isCancelled && (
          <div className="flex flex-col gap-1 md:flex-row md:gap-2 mt-2">
            {chapterPeriod && chapterPeriod.is_published && chapterPeriod.lesson_plan_url && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-8 md:h-7 md:text-xs text-xs font-medium"
                onClick={handleViewLesson}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Plan
              </Button>
            )}

            {userCanLog && canLog && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 md:h-7 md:text-xs text-xs font-medium"
                onClick={() => setIsLogModalOpen(true)}
              >
                Log period
              </Button>
            )}

            {userCanLog && isLogged && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-8 md:h-7 md:text-xs text-xs font-medium"
                onClick={() => setIsLogModalOpen(true)}
              >
                Edit log
              </Button>
            )}

            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-8 md:h-7 md:text-xs text-xs font-medium"
                onClick={() => setIsOverrideModalOpen(true)}
              >
                <Settings className="w-3 h-3 mr-1" />
                Override
              </Button>
            )}
          </div>
        )}

        {/* Display ID */}
        {periodInstance.display_id && (
          <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
            <code className="text-[10px] font-mono text-muted-foreground">
              {periodInstance.display_id}
            </code>
            <button
              onClick={handleCopyId}
              title="Copy ID"
              className="p-1 hover:bg-muted rounded transition"
            >
              {copiedId ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : (
                <Copy className="w-3 h-3 text-muted-foreground" />
              )}
            </button>
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

      {isAdmin && (
        <OverrideModal
          open={isOverrideModalOpen}
          onOpenChange={setIsOverrideModalOpen}
          slot={slot}
          periodInstance={periodInstance}
          existingOverride={periodOverride}
          chapters={chapters}
          teachers={teachers}
          subject={subject}
          division={division}
        />
      )}
    </>
  );
}
