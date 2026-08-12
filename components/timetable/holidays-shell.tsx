"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, CalendarOff, Edit2, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createHoliday, deleteHoliday, updateHoliday } from "@/lib/actions/timetable";
import { Holiday } from "@/lib/types";
import { parseDateOnly, formatDateOnly } from "@/lib/utils/date";

type ViewMode = "list" | "calendar";
type ScopeType = "all" | "division";

interface HolidaysShellProps {
  holidays: Holiday[];
  standards: Array<{ id: string; name: string; grade: number }>;
  divisions: Array<{ id: string; name: string; standard_id: string }>;
  activeSchoolYear: { id: string; name: string; start_date: string; end_date: string };
}

const TYPE_COLORS: Record<string, { label: string; color: string }> = {
  national: { label: "National Holiday", color: "bg-red-100 text-red-700" },
  school_event: { label: "School Event", color: "bg-blue-100 text-blue-700" },
  exam: { label: "Exam", color: "bg-purple-100 text-purple-700" },
  unplanned: { label: "Unplanned", color: "bg-amber-100 text-amber-700" },
};

export function HolidaysShell({
  holidays,
  standards,
  divisions,
  activeSchoolYear,
}: HolidaysShellProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [scopeType, setScopeType] = useState<ScopeType>("all");
  const [selectedStandardId, setSelectedStandardId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [calendarCursor, setCalendarCursor] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });

  const [formData, setFormData] = useState({
    date: "",
    end_date: "",
    name: "",
    type: "school_event" as "national" | "school_event" | "exam" | "unplanned",
    affects_all: true,
    division_id: "",
  });

  const filteredDivisions = selectedStandardId
    ? divisions.filter((d) => d.standard_id === selectedStandardId)
    : [];

  const handleAddHoliday = async () => {
    if (!formData.date || !formData.name) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (formData.end_date && formData.end_date < formData.date) {
      toast.error("End date cannot be before the start date");
      return;
    }

    setLoading(true);
    const fd = new FormData();
    fd.set("school_year_id", activeSchoolYear.id);
    fd.set("date", formData.date);
    fd.set("end_date", formData.end_date || formData.date);
    fd.set("name", formData.name);
    fd.set("type", formData.type);
    fd.set("affects_all", String(scopeType === "all"));
    if (scopeType === "division" && formData.division_id) {
      fd.set("division_id", formData.division_id);
    }

    const result = await createHoliday(fd);
    setLoading(false);

    if (result.error) {
      toast.error("Failed to add holiday", { description: result.error });
    } else {
      toast.success("Holiday added");
      setFormData({ date: "", end_date: "", name: "", type: "school_event", affects_all: true, division_id: "" });
      setScopeType("all");
      setSelectedStandardId(null);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    setLoading(true);
    const result = await deleteHoliday(id);
    setLoading(false);

    if (result.error) {
      toast.error("Failed to delete holiday", { description: result.error });
    } else {
      toast.success("Holiday deleted");
    }
  };

  const groupedHolidays = holidays.reduce(
    (acc, h) => {
      const date = parseDateOnly(h.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(h);
      return acc;
    },
    {} as Record<string, Holiday[]>
  );

  const monthLabels: Record<string, string> = {
    "2026-01": "January 2026",
    "2026-02": "February 2026",
    "2026-03": "March 2026",
    "2026-04": "April 2026",
    "2026-05": "May 2026",
    "2026-06": "June 2026",
    "2026-07": "July 2026",
    "2026-08": "August 2026",
    "2026-09": "September 2026",
    "2026-10": "October 2026",
    "2026-11": "November 2026",
    "2026-12": "December 2026",
  };

  const calendarMonthKey = `${calendarCursor.year}-${String(calendarCursor.month + 1).padStart(2, "0")}`;
  const holidaysByDay = new Map<number, Holiday[]>();
  for (const h of holidays) {
    for (
      let cursor = parseDateOnly(h.date);
      cursor <= parseDateOnly(h.end_date);
      cursor.setDate(cursor.getDate() + 1)
    ) {
      if (cursor.getFullYear() !== calendarCursor.year || cursor.getMonth() !== calendarCursor.month) continue;
      const day = cursor.getDate();
      holidaysByDay.set(day, [...(holidaysByDay.get(day) ?? []), h]);
    }
  }

  const daysInMonth = new Date(calendarCursor.year, calendarCursor.month + 1, 0).getDate();
  const firstWeekday = new Date(calendarCursor.year, calendarCursor.month, 1).getDay();
  const calendarCells: Array<{ day: number; holidays: Holiday[] } | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      holidays: holidaysByDay.get(i + 1) ?? [],
    })),
  ];

  const calendarMonthLabel = new Date(calendarCursor.year, calendarCursor.month, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  const goToPrevMonth = () =>
    setCalendarCursor(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  const goToNextMonth = () =>
    setCalendarCursor(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );

  return (
    <div className="bg-[#FAFAFA] min-h-screen p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-semibold text-gray-900">Holidays</h1>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "secondary"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setViewMode("list")}
            >
              List
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "secondary"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setViewMode("calendar")}
            >
              Calendar
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Mark non-teaching days for the active school year.
        </p>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Add Holiday Form */}
        <Card className="bg-white border border-[#E5E5E5]">
          <CardHeader>
            <CardTitle className="text-base">Add holiday</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">START DATE</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      date: e.target.value,
                      end_date: formData.end_date && formData.end_date < e.target.value ? e.target.value : formData.end_date,
                    })
                  }
                  disabled={loading}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">END DATE</Label>
                <Input
                  type="date"
                  min={formData.date || undefined}
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  disabled={loading}
                  className="h-8"
                />
              </div>
            </div>
            <p className="text-[11px] text-gray-500 -mt-2">
              Leave end date blank for a single-day holiday. For multi-day holidays like Diwali, set the last day it covers.
            </p>

            <div className="space-y-2">
              <Label className="text-xs font-medium">HOLIDAY NAME</Label>
              <Input
                placeholder="e.g. Diwali, Republic Day, Sports Day"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
                className="h-8"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">TYPE</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    type: value as "national" | "school_event" | "exam" | "unplanned",
                  })
                }
                disabled={loading}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national">National Holiday</SelectItem>
                  <SelectItem value="school_event">School Event</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="unplanned">Unplanned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">AFFECTS</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setScopeType("all")}
                  disabled={loading}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors ${
                    scopeType === "all"
                      ? "bg-[#171717] text-white"
                      : "bg-[#F5F5F5] text-[#525252] hover:bg-gray-200"
                  }`}
                >
                  All Classes
                </button>
                <button
                  onClick={() => setScopeType("division")}
                  disabled={loading}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors ${
                    scopeType === "division"
                      ? "bg-[#171717] text-white"
                      : "bg-[#F5F5F5] text-[#525252] hover:bg-gray-200"
                  }`}
                >
                  Specific Division
                </button>
              </div>
            </div>

            {scopeType === "division" && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">STANDARD</Label>
                  <Select
                    value={selectedStandardId || ""}
                    onValueChange={setSelectedStandardId}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select standard" />
                    </SelectTrigger>
                    <SelectContent>
                      {standards.map((std) => (
                        <SelectItem key={std.id} value={std.id}>
                          {std.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedStandardId && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">DIVISION</Label>
                    <Select
                      value={formData.division_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, division_id: value })
                      }
                      disabled={loading}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select division" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDivisions.map((div) => (
                          <SelectItem key={div.id} value={div.id}>
                            {div.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            <Button
              className="w-full h-8 text-xs bg-[#ba2032] hover:bg-red-700 text-white"
              onClick={handleAddHoliday}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                "Add holiday"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right: Holiday List or Calendar */}
        {viewMode === "list" ? (
          <Card className="bg-white border border-[#E5E5E5]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Holidays</CardTitle>
                <Badge variant="outline" className="font-normal">
                  {holidays.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {holidays.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <CalendarOff className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-900">
                    No holidays marked yet
                  </p>
                  <p className="text-xs text-gray-600">
                    Add holidays using the form
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {Object.entries(groupedHolidays)
                    .sort()
                    .map(([monthKey, monthHolidays]) => (
                      <div key={monthKey}>
                        <div className="text-[11px] uppercase text-[#A3A3A3] px-5 py-2 bg-[#FAFAFA] border-b border-[#E5E5E5] font-medium">
                          {monthLabels[monthKey] || monthKey}
                        </div>
                        {monthHolidays.map((holiday) => (
                          <div
                            key={holiday.id}
                            className="h-11 px-5 py-3 border-b border-[#F5F5F5] hover:bg-[#FAFAFA] flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-xs font-semibold text-gray-900 w-24 shrink-0">
                                {holiday.end_date && holiday.end_date !== holiday.date
                                  ? `${formatDateOnly(holiday.date)} – ${formatDateOnly(holiday.end_date)}`
                                  : formatDateOnly(holiday.date)}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {holiday.name}
                              </span>
                              {holiday.end_date && holiday.end_date !== holiday.date && (
                                <Badge variant="outline" className="font-normal text-[10px]">
                                  {Math.round(
                                    (parseDateOnly(holiday.end_date).getTime() - parseDateOnly(holiday.date).getTime()) /
                                      86400000
                                  ) + 1}{" "}
                                  days
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <Badge className={TYPE_COLORS[holiday.type].color}>
                                {TYPE_COLORS[holiday.type].label}
                              </Badge>
                              <Badge variant="outline">
                                {holiday.affects_all
                                  ? "All Classes"
                                  : `Division ${holiday.division_id}`}
                              </Badge>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                <button
                                  onClick={() => setEditingId(holiday.id)}
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  <Edit2 className="h-4 w-4 text-gray-500" />
                                </button>
                                <button
                                  onClick={() => handleDeleteHoliday(holiday.id)}
                                  disabled={loading}
                                  className="p-1 hover:bg-red-100 rounded"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white border border-[#E5E5E5]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={goToPrevMonth}>
                  ←
                </Button>
                <CardTitle className="text-base">{calendarMonthLabel}</CardTitle>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={goToNextMonth}>
                  →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase text-[#A3A3A3] font-medium mb-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell, i) =>
                  cell === null ? (
                    <div key={`blank-${i}`} />
                  ) : (
                    <div
                      key={cell.day}
                      className={`min-h-16 rounded-md border p-1 text-left align-top ${
                        cell.holidays.length > 0
                          ? "border-[#E5E5E5] bg-[#FAFAFA]"
                          : "border-transparent"
                      }`}
                    >
                      <div className="text-xs font-medium text-gray-700">{cell.day}</div>
                      <div className="mt-1 space-y-0.5">
                        {cell.holidays.map((h) => (
                          <div
                            key={h.id}
                            className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${TYPE_COLORS[h.type].color}`}
                            title={h.name}
                          >
                            {h.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
              {holidaysByDay.size === 0 && (
                <div className="text-center py-4 text-gray-400 text-xs">
                  No holidays marked in {calendarMonthLabel}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
