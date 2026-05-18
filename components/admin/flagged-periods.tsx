import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { getTodayIsoDate } from "@/lib/timetable-constants";
import Link from "next/link";

interface FlaggedPeriodsProps {
  unloggedPeriods: any[];
  teacherMap: Map<string, any>;
  subjectMap: Map<string, any>;
  divisionMap: Map<string, any>;
  standardMap: Map<string, any>;
  chapterMap?: Map<string, any>;
}

export function FlaggedPeriods({
  unloggedPeriods,
  teacherMap,
  subjectMap,
  divisionMap,
  standardMap,
  chapterMap,
}: FlaggedPeriodsProps) {
  const today = getTodayIsoDate();

  const calculateDaysOverdue = (dateStr: string): number => {
    const periodDate = new Date(dateStr);
    const todayDate = new Date(today);
    const diffMs = todayDate.getTime() - periodDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  const getDaysOverdueColor = (days: number): string => {
    if (days > 2) return "text-red-600 bg-red-50";
    if (days >= 1) return "text-amber-600 bg-amber-50";
    return "text-gray-600 bg-gray-50";
  };

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4">Flagged Periods</h3>

      {unloggedPeriods.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-green-600">
          <CheckCircle className="w-5 h-5 mr-2" />
          <p className="text-sm font-medium">All periods are logged. Nice work.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {unloggedPeriods.slice(0, 10).map((period) => {
            const daysOverdue = calculateDaysOverdue(period.date);
            const teacher = teacherMap.get(period.teacher_id);
            const chapter = chapterMap?.get(period.chapter_id);
            const subject = chapter ? subjectMap.get(chapter.subject_id) : null;

            // For view link, we need the week start (Monday) for the period date
            function getMondayOfWeek(date: Date): Date {
              const d = new Date(date);
              const day = d.getDay();
              const diff = d.getDate() - day + (day === 0 ? -6 : 1);
              return new Date(d.setDate(diff));
            }

            const weekStart = getMondayOfWeek(new Date(period.date));
            const weekIso = weekStart.toISOString().split("T")[0];

            return (
              <div
                key={period.id}
                className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/50 transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{teacher?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {subject?.name || "Unknown Subject"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(period.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${getDaysOverdueColor(daysOverdue)}`}
                  >
                    {daysOverdue > 0 ? `${daysOverdue}d overdue` : "Today"}
                  </span>
                  <Link
                    href={`/teacher?teacher=${period.teacher_id}&week=${weekIso}`}
                  >
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
          {unloggedPeriods.length > 10 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              +{unloggedPeriods.length - 10} more
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
