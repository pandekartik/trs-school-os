"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCard } from "@/components/shared/alert-card";
import { FlaggedPeriods } from "@/components/admin/flagged-periods";
import { TeacherTable } from "@/components/admin/teacher-table";
import { ChapterProgress } from "@/components/admin/chapter-progress";
import { PendingActions } from "@/components/admin/pending-actions";
import { refreshDashboard } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/role-access";
import type {
  AcademicSegment,
  Chapter,
  CoverageSummary,
  Division,
  Holiday,
  LeaveRequest,
  PeriodInstance,
  SchoolYear,
  Standard,
  Subject,
  Teacher,
  TeacherAbsence,
} from "@/lib/types";

type DashboardPeriod = PeriodInstance & {
  period_number?: number | null;
  subject_id?: string | null;
  slot?: { period_number?: number | null } | null;
  timetable_slot?: { period_number?: number | null } | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface DashboardShellProps {
  role: UserRole;
  activeSchoolYear: SchoolYear | null;
  teachers: Teacher[];
  standards: Standard[];
  divisions: Division[];
  subjects: Subject[];
  periodInstancesToday: DashboardPeriod[];
  periodInstancesThisWeek: DashboardPeriod[];
  unloggedPeriods: DashboardPeriod[];
  coverageSummaryThisWeek: CoverageSummary[];
  chapters: Chapter[];
  academicSegments: AcademicSegment[];
  absencesThisWeek: TeacherAbsence[];
  holidaysThisWeek: Holiday[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pendingLeaves: (LeaveRequest & { teacher: any })[];
  totalPendingCount: number;
  weekStart: Date;
  today: Date;
}

function DashboardPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold leading-tight tracking-[-0.02em] text-foreground">
          {title}
        </h1>
        <p className="mt-1 text-[13px] text-text-muted">{subtitle}</p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

function DashboardKpiCard({
  label,
  value,
  unit,
  delta,
  deltaTone = "up",
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3.5">
      <span className="font-mono text-[10px] tracking-[0.04em] text-text-muted uppercase">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold leading-none tracking-[-0.02em] text-foreground">
          {value}
        </span>
        {unit && <span className="text-xs text-text-muted">{unit}</span>}
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-mono text-[11px]",
              deltaTone === "up" && "text-success",
              deltaTone === "down" && "text-error",
              deltaTone === "neutral" && "text-text-muted"
            )}
          >
            {deltaTone === "up" && <TrendingUp className="size-3" />}
            {deltaTone === "down" && <TrendingDown className="size-3" />}
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

function DashboardPanel({
  title,
  meta,
  children,
  className,
}: {
  title: string;
  meta?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 py-0", className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
        <h2 className="text-[13px] font-semibold text-foreground">{title}</h2>
        {meta && <span className="font-mono text-[11px] text-text-muted">{meta}</span>}
      </div>
      <div className="p-4">{children}</div>
    </Card>
  );
}

function getPeriodNumber(period: DashboardPeriod, fallback: number) {
  return Number(
    period.period_number ??
      period.slot?.period_number ??
      period.timetable_slot?.period_number ??
      period.chapter_period_sequence ??
      fallback
  );
}

function CoverageByPeriod({
  periods,
}: {
  periods: DashboardPeriod[];
}) {
  const periodStats = Array.from({ length: 8 }).map((_, index) => {
    const periodNumber = index + 1;
    const matching = periods.filter((period, periodIndex) => getPeriodNumber(period, (periodIndex % 8) + 1) === periodNumber);
    const logged = matching.filter((period) => period.status === "done" || period.status === "partial").length;
    const percent = matching.length > 0 ? Math.round((logged / matching.length) * 100) : 0;

    return { periodNumber, percent };
  });

  return (
    <div>
      <div className="flex h-56 items-end gap-1 px-1 py-3">
        {periodStats.map((stat) => (
          <div key={stat.periodNumber} className="flex flex-1 items-end">
            <div
              className={cn(
                "w-full rounded-t-[3px] bg-surface-3 transition-[height]",
                stat.percent >= 80 && "bg-brand",
                stat.percent > 0 && stat.percent < 80 && "bg-warning"
              )}
              style={{ height: `${Math.max(stat.percent, 18)}%`, opacity: stat.percent === 0 ? 0.55 : 0.9 }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between px-1 font-mono text-[10px] text-text-muted">
        {periodStats.map((stat) => (
          <span key={stat.periodNumber}>P{stat.periodNumber}</span>
        ))}
      </div>
    </div>
  );
}

function RecentActivity({
  periodInstancesToday,
  unloggedPeriods,
  teacherMap,
  subjectMap,
}: {
  periodInstancesToday: DashboardPeriod[];
  unloggedPeriods: DashboardPeriod[];
  teacherMap: Map<string, Teacher>;
  subjectMap: Map<string, Subject>;
}) {
  const loggedActivity = periodInstancesToday
    .filter((period): period is DashboardPeriod & { logged_at: string } => Boolean(period.logged_at))
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
    .slice(0, 3)
    .map((period) => ({
      id: period.id,
      tone: "success" as const,
      title: `${teacherMap.get(period.teacher_id)?.name ?? "Teacher"} logged ${period.subject_id ? subjectMap.get(period.subject_id)?.name ?? "a period" : "a period"}`,
      meta: new Date(period.logged_at).toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

  const flaggedActivity = unloggedPeriods.slice(0, 2).map((period) => ({
    id: period.id,
    tone: "brand" as const,
    title: `${teacherMap.get(period.teacher_id)?.name ?? "Teacher"} has an unlogged period`,
    meta: new Date(period.date).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      month: "short",
      day: "numeric",
    }),
  }));

  const activity = [...flaggedActivity, ...loggedActivity].slice(0, 5);

  if (activity.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface px-4 py-8 text-center">
        <p className="text-[13px] font-medium text-foreground">No activity yet.</p>
        <p className="mt-1 text-[13px] text-text-muted">Live updates will appear as teachers log periods.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {activity.map((item) => (
        <div key={item.id} className="flex items-start gap-3">
          <span
            className={cn(
              "mt-1.5 size-2 shrink-0 rounded-full bg-text-muted",
              item.tone === "brand" && "bg-brand",
              item.tone === "success" && "bg-success"
            )}
          />
          <div className="min-w-0">
            <p className="text-[13px] leading-5 text-foreground">{item.title}</p>
            <p className="mt-0.5 font-mono text-[11px] tracking-[0.02em] text-text-muted uppercase">
              {item.meta}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardShell({
  role,
  activeSchoolYear,
  teachers,
  standards,
  divisions,
  subjects,
  periodInstancesToday,
  periodInstancesThisWeek,
  unloggedPeriods,
  coverageSummaryThisWeek,
  chapters,
  academicSegments,
  absencesThisWeek,
  holidaysThisWeek,
  pendingLeaves,
  totalPendingCount,
  weekStart,
  today,
}: DashboardShellProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const todayDone = periodInstancesToday.filter((p) => p.status === "done").length;
  const todayPartial = periodInstancesToday.filter((p) => p.status === "partial").length;
  const todayLogged = todayDone + todayPartial;
  const todayTotal = periodInstancesToday.length;
  const todayCoveragePercent =
    todayTotal > 0 ? Math.round((todayLogged / todayTotal) * 100) : 0;

  const weeklyCoverageAvg =
    coverageSummaryThisWeek.length > 0
      ? Math.round(
          coverageSummaryThisWeek.reduce((sum, c) => sum + (c.coverage_pct || 0), 0) /
            coverageSummaryThisWeek.length
        )
      : 0;

  const activeTeachersThisWeek = new Set(
    periodInstancesThisWeek.map((p) => p.teacher_id)
  ).size;

  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const standardMap = new Map(standards.map((s) => [s.id, s]));
  const divisionMap = new Map(divisions.map((d) => [d.id, d]));
  const chapterMap = new Map(chapters.map((c) => [c.id, c]));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const weekStartIso = weekStart.toISOString().split("T")[0];
      await refreshDashboard(weekStartIso);
      router.refresh();
      toast.success("Dashboard updated");
    } catch {
      toast.error("Failed to refresh dashboard");
    } finally {
      setIsRefreshing(false);
    }
  };

  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(weekStart.getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  const todayLabel = today.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="flex flex-col">
      <DashboardPageHeader
        title="Dashboard"
        subtitle={`Live coverage across The Rosary School & Jr. College · ${todayLabel}.`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Refreshing..." : "Refresh data"}
          </Button>
        }
      />

      <PendingActions pendingLeaves={pendingLeaves} totalPending={totalPendingCount} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardKpiCard
          label="Coverage today"
          value={todayCoveragePercent}
          unit="%"
          delta={`${todayLogged}/${todayTotal}`}
          deltaTone={todayCoveragePercent >= 80 ? "up" : todayCoveragePercent >= 50 ? "neutral" : "down"}
        />
        <DashboardKpiCard
          label="Unlogged periods"
          value={unloggedPeriods.length}
          delta={unloggedPeriods.length > 0 ? "Needs attention" : "Clear"}
          deltaTone={unloggedPeriods.length > 0 ? "down" : "up"}
        />
        <DashboardKpiCard
          label="Weekly coverage"
          value={weeklyCoverageAvg}
          unit="%"
          delta={weekLabel}
          deltaTone="neutral"
        />
        <DashboardKpiCard
          label="Teachers active"
          value={activeTeachersThisWeek}
          unit={`/ ${teachers.length}`}
          delta={`${absencesThisWeek.length} absences`}
          deltaTone={absencesThisWeek.length > 0 ? "neutral" : "up"}
        />
      </div>

      <div className="mb-4 grid gap-3 xl:grid-cols-[2fr_1fr]">
        <DashboardPanel title="Coverage by period" meta="TODAY · 8 PERIODS">
          <CoverageByPeriod periods={periodInstancesToday} />
        </DashboardPanel>

        <DashboardPanel title="Recent activity" meta={role.toUpperCase()}>
          <RecentActivity
            periodInstancesToday={periodInstancesToday}
            unloggedPeriods={unloggedPeriods}
            teacherMap={teacherMap}
            subjectMap={subjectMap}
          />
        </DashboardPanel>
      </div>

      <div className="mb-4 grid gap-3 xl:grid-cols-2">
        <FlaggedPeriods
          unloggedPeriods={unloggedPeriods}
          teacherMap={teacherMap}
          subjectMap={subjectMap}
          divisionMap={divisionMap}
          standardMap={standardMap}
          chapterMap={chapterMap}
        />

        <DashboardPanel title="This week" meta={weekLabel.toUpperCase()}>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => {
              const date = new Date(weekStart);
              date.setDate(date.getDate() + i);
              const dateIso = date.toISOString().split("T")[0];
              const isToday = dateIso === today.toISOString().split("T")[0];
              const dayPeriods = periodInstancesThisWeek.filter((p) => p.date === dateIso);
              const dayLogged = dayPeriods.filter((p) => p.status === "done" || p.status === "partial").length;
              const dayTotal = dayPeriods.length;
              const dayCoverage = dayTotal > 0 ? Math.round((dayLogged / dayTotal) * 100) : 0;
              const dayHoliday = holidaysThisWeek.find((h) => h.date === dateIso);
              const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"];

              return (
                <div
                  key={dateIso}
                  className={cn(
                    "flex items-center justify-between rounded-[var(--radius-card)] border px-3 py-2.5",
                    isToday ? "border-brand bg-brand text-white" : "border-border bg-surface-2"
                  )}
                >
                  <div>
                    <div className="text-[13px] font-medium">
                      {dayNames[i]} {date.getDate()}
                    </div>
                    {dayHoliday && <div className="mt-0.5 text-xs opacity-80">{dayHoliday.name}</div>}
                  </div>
                  {!dayHoliday && (
                    <div
                      className={cn(
                        "font-mono text-[11px] font-medium",
                        !isToday && dayCoverage >= 80 && "text-success",
                        !isToday && dayCoverage < 80 && dayCoverage >= 50 && "text-warning",
                        !isToday && dayCoverage < 50 && "text-error"
                      )}
                    >
                      {dayLogged}/{dayTotal} · {dayCoverage}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {absencesThisWeek.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <h3 className="mb-2 font-mono text-[10px] tracking-[0.04em] text-text-muted uppercase">
                Absences
              </h3>
              <div className="space-y-2">
                {absencesThisWeek.slice(0, 4).map((absence) => (
                  <div key={absence.id} className="text-[13px] text-text-secondary">
                    <span className="font-medium text-foreground">
                      {teacherMap.get(absence.teacher_id)?.name}
                    </span>
                    <span className="text-text-muted"> {"->"} </span>
                    <span className="font-medium text-foreground">
                      {teacherMap.get(absence.substitute_teacher_id)?.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DashboardPanel>
      </div>

      {!activeSchoolYear && (
        <AlertCard className="mb-4" variant="warning" title="No active school year">
          Configure an active school year in Setup before generating schedules.
        </AlertCard>
      )}

      {activeSchoolYear && periodInstancesThisWeek.length === 0 && (
        <AlertCard className="mb-4" variant="info" title="No schedule generated">
          Go to Timetable to generate the current week&apos;s schedule.
        </AlertCard>
      )}

      <div className="grid gap-4">
        <TeacherTable
          teachers={teachers}
          coverageSummaryThisWeek={coverageSummaryThisWeek}
          subjectMap={subjectMap}
          periodInstancesThisWeek={periodInstancesThisWeek}
          weekStart={weekStart}
          chapterMap={chapterMap}
        />

        <ChapterProgress
          chapters={chapters}
          academicSegments={academicSegments}
          standards={standards}
          subjects={subjects}
          periodInstancesThisWeek={periodInstancesThisWeek}
        />
      </div>
    </div>
  );
}
