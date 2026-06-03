"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ChevronDown, Download, ActivitySquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  entity_label?: string;
  old_data?: Record<string, any> | null;
  new_data?: Record<string, any> | null;
  created_at: string;
}

interface Teacher {
  id: string;
  name: string;
}

const actionCategories: Record<string, string[]> = {
  auth: ["user.signed_in", "user.signed_out", "user.password_changed", "user.invited"],
  setup: [
    "school_year.created",
    "school_year.updated",
    "school_year.deleted",
    "school_year.set_active",
    "standard.created",
    "standard.updated",
    "standard.deleted",
    "division.created",
    "division.updated",
    "division.deleted",
    "segment.created",
    "segment.updated",
    "segment.deleted",
    "subject.created",
    "subject.updated",
    "subject.deleted",
    "teacher.created",
    "teacher.updated",
    "teacher.deleted",
    "chapter.created",
    "chapter.updated",
    "chapter.deleted",
    "allocation.created",
    "allocation.deleted",
  ],
  timetable: [
    "template.created",
    "template.updated",
    "template.deleted",
    "timetable.slot_saved",
    "timetable.slot_cleared",
    "timetable.finalized",
    "timetable.moved_to_draft",
    "holiday.created",
    "holiday.deleted",
  ],
  content: [
    "lesson_plan.uploaded",
    "lesson_plan.published",
    "lesson_plan.unpublished",
    "mcq.saved",
    "test.saved",
  ],
  operations: [
    "period.logged",
    "period.log_edited",
    "teacher.absence_marked",
    "teacher.absence_deleted",
  ],
};

const categoryColors: Record<string, string> = {
  auth: "bg-blue-100 text-blue-800 border-blue-300",
  setup: "bg-purple-100 text-purple-800 border-purple-300",
  timetable: "bg-amber-100 text-amber-800 border-amber-300",
  content: "bg-green-100 text-green-800 border-green-300",
  operations: "bg-brand-50 text-brand border-brand-200",
};

function getActionCategory(action: string): string {
  for (const [category, actions] of Object.entries(actionCategories)) {
    if (actions.includes(action)) return category;
  }
  return "other";
}

function formatActionLabel(action: string): string {
  return action
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (dateOnly.getTime() === today.getTime()) {
    return `Today ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function downloadCSV(logs: AuditLog[]) {
  const headers = ["Timestamp", "User", "Action", "Entity Type", "Entity Label"];
  const rows = logs.map((log) => [
    new Date(log.created_at).toLocaleString("en-IN"),
    log.user_name,
    log.action,
    log.entity_type || "-",
    log.entity_label || "-",
  ]);

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `trs-activity-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  initialLogs: AuditLog[];
  teachers: Teacher[];
}

export function ActivityShell({ initialLogs, teachers }: Props) {
  const [logs] = useState<AuditLog[]>(initialLogs);
  const [filterUser, setFilterUser] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterUser !== "all" && log.user_id !== filterUser) return false;

      if (filterCategory !== "all") {
        const category = getActionCategory(log.action);
        if (category !== filterCategory) return false;
      }

      if (filterDateFrom) {
        const logDate = new Date(log.created_at);
        const fromDate = new Date(filterDateFrom);
        if (logDate < fromDate) return false;
      }

      if (filterDateTo) {
        const logDate = new Date(log.created_at);
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (logDate > toDate) return false;
      }

      return true;
    });
  }, [logs, filterUser, filterCategory, filterDateFrom, filterDateTo]);

  function resetFilters() {
    setFilterUser("all");
    setFilterCategory("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Activity Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every action taken by every user in the system.
        </p>
      </div>

      <div className="flex gap-2 items-end bg-muted/40 p-4 rounded-lg">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground block mb-2">User</label>
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              {teachers.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground block mb-2">Category</label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="auth">Auth</SelectItem>
              <SelectItem value="setup">Setup</SelectItem>
              <SelectItem value="timetable">Timetable</SelectItem>
              <SelectItem value="content">Content</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground block mb-2">From</label>
          <Input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="h-9"
          />
        </div>

        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground block mb-2">To</label>
          <Input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="h-9"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={resetFilters}
          className="h-9"
        >
          Clear
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadCSV(filteredLogs)}
          className="h-9 gap-2"
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex items-center justify-between px-0.5">
        <div className="text-xs text-muted-foreground">
          {filteredLogs.length} of {logs.length} events shown
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <ActivitySquare className="size-10 text-muted-foreground" />
              <div>
                <p className="font-medium">No activity yet</p>
                <p className="text-sm text-muted-foreground">
                  Actions taken in the system will appear here
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">WHEN</TableHead>
                    <TableHead className="w-48">USER</TableHead>
                    <TableHead className="w-56">ACTION</TableHead>
                    <TableHead className="flex-1">ENTITY</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/50">
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex size-6 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-white">
                            {getInitials(log.user_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{log.user_name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", categoryColors[getActionCategory(log.action)])}
                        >
                          {formatActionLabel(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.entity_type && log.entity_label
                          ? `${log.entity_type} · ${log.entity_label}`
                          : log.entity_type || "-"}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() =>
                            setExpandedRow(expandedRow === log.id ? null : log.id)
                          }
                          className="p-1 hover:bg-surface-2 rounded"
                        >
                          <ChevronDown
                            className={cn(
                              "size-4 transition-transform",
                              expandedRow === log.id && "rotate-180"
                            )}
                          />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Expanded rows */}
              {filteredLogs.map((log) => {
                if (expandedRow !== log.id) return null;

                return (
                  <div key={`${log.id}-expanded`} className="border-t bg-muted/30 p-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                          Before
                        </p>
                        <div className="bg-red-50 border border-red-200 rounded p-3 overflow-x-auto">
                          {log.old_data ? (
                            <pre className="font-mono text-xs whitespace-pre-wrap break-words">
                              {JSON.stringify(log.old_data, null, 2)}
                            </pre>
                          ) : (
                            <p className="text-xs text-muted-foreground">New record</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                          After
                        </p>
                        <div className="bg-green-50 border border-green-200 rounded p-3 overflow-x-auto">
                          {log.new_data ? (
                            <pre className="font-mono text-xs whitespace-pre-wrap break-words">
                              {JSON.stringify(log.new_data, null, 2)}
                            </pre>
                          ) : (
                            <p className="text-xs text-muted-foreground">Record deleted</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
  );
}
