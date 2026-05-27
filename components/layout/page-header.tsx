"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PERIOD_TIMES } from "@/lib/timetable-constants";
import type { UserRole } from "@/lib/role-access";

const routeMeta: Record<string, { section: string; title: string }> = {
  "/admin": { section: "ADMIN", title: "Dashboard" },
  "/admin/users": { section: "ADMIN", title: "Users" },
  "/setup": { section: "ADMIN", title: "Setup" },
  "/setup/school-year": { section: "ADMIN", title: "School Year" },
  "/setup/standards": { section: "ADMIN", title: "Standards" },
  "/setup/segments": { section: "ADMIN", title: "Segments" },
  "/setup/subjects": { section: "ADMIN", title: "Subjects" },
  "/setup/teachers": { section: "ADMIN", title: "Teachers" },
  "/setup/chapters": { section: "ADMIN", title: "Chapters" },
  "/setup/teacher-allocation": { section: "ADMIN", title: "Teacher Allocation" },
  "/content": { section: "CONTENT", title: "Library" },
  "/timetable": { section: "ADMIN", title: "Timetable" },
  "/timetable/templates": { section: "ADMIN", title: "Time Templates" },
  "/timetable/builder": { section: "ADMIN", title: "Timetable" },
  "/timetable/holidays": { section: "ADMIN", title: "Holidays" },
  "/teacher": { section: "TEACHER", title: "Today" },
};

function getRouteMeta(pathname: string) {
  const exact = routeMeta[pathname];
  if (exact) return exact;
  if (pathname.startsWith("/admin/users")) return routeMeta["/admin/users"];
  return { section: "TRS", title: "School OS" };
}

function getIstParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  return { hour, minute };
}

function toMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function LivePeriodIndicator() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const { label, timeLabel } = useMemo(() => {
    const { hour, minute } = getIstParts(now);
    const current = hour * 60 + minute;
    const activePeriod = PERIOD_TIMES.find(
      (period) => current >= toMinutes(period.start) && current < toMinutes(period.end)
    );

    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const suffix = hour >= 12 ? "PM" : "AM";
    const formattedTime = `${String(displayHour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${suffix} IST`;

    return {
      label: activePeriod
        ? `LIVE · PERIOD ${String(activePeriod.period).padStart(2, "0")} / 08`
        : "LIVE · BETWEEN PERIODS",
      timeLabel: formattedTime,
    };
  }, [now]);

  return (
    <div
      className="hidden items-center gap-3 border-l border-border pl-3 font-mono text-[11px] text-text-muted lg:flex"
      suppressHydrationWarning
    >
      <span className="inline-flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-success shadow-[0_0_6px_rgba(22,163,74,0.4)]" />
        {label}
      </span>
      <span>{timeLabel}</span>
    </div>
  );
}

interface ShellTopbarProps {
  role: UserRole | null;
  schoolYearName?: string | null;
}

export function ShellTopbar({ role, schoolYearName }: ShellTopbarProps) {
  const pathname = usePathname();
  const meta = getRouteMeta(pathname);
  const badgeRole = role === "super_admin" ? "admin" : (role ?? "teacher");

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface pl-1 pr-4">
      <div className="flex min-w-0 items-center">
        <SidebarTrigger className="ml-2 size-7 text-text-muted hover:text-foreground" />
        <span className="mx-2 h-4 w-px bg-border" />
        <span className="font-mono text-[11px] text-text-muted">{meta.section}</span>
        <span className="mx-2 text-[13px] text-text-disabled">/</span>
        <span className="truncate text-sm font-medium tracking-[-0.005em] text-foreground">
          {meta.title}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        {schoolYearName && (
          <Badge variant="outline" className="hidden sm:inline-flex">
            {schoolYearName}
          </Badge>
        )}
        {role && (
          <Badge variant={badgeRole} className="capitalize">
            <span className="size-1.5 rounded-full bg-current opacity-75" />
            {role}
          </Badge>
        )}
        <LivePeriodIndicator />
      </div>
    </header>
  );
}

export function PageHeader() {
  const pathname = usePathname();
  return (
    <span className="text-sm font-medium">
      {getRouteMeta(pathname).title}
    </span>
  );
}
