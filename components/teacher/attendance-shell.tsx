"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Teacher, TeacherAttendance, TimetableSlot, PeriodOverride } from "@/lib/types";
import type { UserRole } from "@/lib/role-access";
import { markAttendance, bulkMarkAttendance, deleteAttendance } from "@/lib/actions/teacher";
import { savePeriodOverride } from "@/lib/actions/timetable";
import { AttendanceModal } from "@/components/teacher/attendance-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  role: UserRole | null;
  profile: any;
  currentMonth: number;
  currentYear: number;
  teachers: Teacher[];
  attendance: TeacherAttendance[];
  timetableSlots: TimetableSlot[];
  periodOverrides: PeriodOverride[];
  selectedTeacherId: string | null;
  branchId: string;
}

export function AttendanceShell({
  role,
  profile,
  currentMonth,
  currentYear,
  teachers,
  attendance,
  timetableSlots,
  periodOverrides,
  selectedTeacherId,
  branchId,
}: Props) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceModalTeacher, setAttendanceModalTeacher] = useState<string | null>(null);
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
  const [selectedAbsentTeacher, setSelectedAbsentTeacher] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [overrideType, setOverrideType] = useState<"substitute" | "cancel">("substitute");
  const [substituteTeacherId, setSubstituteTeacherId] = useState("");
  const [periodReason, setPeriodReason] = useState("");
  const [localAttendance, setLocalAttendance] = useState(attendance);

  const isTeacher = role === "teacher";
  const isAdmin = ["admin", "super_admin"].includes(role ?? "");
  const isToday = () => {
    const now = new Date();
    return (
      now.getFullYear() === currentYear &&
      now.getMonth() === currentMonth - 1
    );
  };

  const getTodayDate = () => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  };

  // Get calendar days for the month
  const getCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const formatDate = (day: number) => {
    const d = new Date(currentYear, currentMonth - 1, day);
    return d.toISOString().split("T")[0];
  };

  const getAttendanceStatus = (teacherId: string, date: string) => {
    return localAttendance.find((a) => a.teacher_id === teacherId && a.date === date);
  };

  const getAttendanceStats = (teacherId: string) => {
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0);
    const startDate = monthStart.toISOString().split("T")[0];
    const endDate = monthEnd.toISOString().split("T")[0];

    const teacherAttendance = localAttendance.filter(
      (a) => a.teacher_id === teacherId && a.date >= startDate && a.date <= endDate
    );

    const present = teacherAttendance.filter((a) => a.status === "present").length;
    const absent = teacherAttendance.filter((a) => a.status === "absent").length;
    const late = teacherAttendance.filter((a) => a.status === "late").length;
    const halfDay = teacherAttendance.filter((a) => a.status === "half_day").length;

    return { present, absent, late, halfDay };
  };

  const handleMarkAttendance = async (
    teacherId: string,
    date: string,
    status: "present" | "absent" | "late" | "half_day",
    reason?: string
  ) => {
    const formData = new FormData();
    formData.append("teacher_id", teacherId);
    formData.append("date", date);
    formData.append("status", status);
    formData.append("reason", reason || "");
    formData.append("marked_by", profile.id);
    formData.append("branch_id", branchId);

    const result = await markAttendance(formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Attendance marked");
      router.refresh();
    }
  };

  const handleBulkMarkPresent = async () => {
    const todayDate = getTodayDate();
    const recordsToMark = teachers
      .filter((t) => !getAttendanceStatus(t.id, todayDate))
      .map((t) => ({
        teacher_id: t.id,
        date: todayDate,
        status: "present",
        reason: "",
      }));

    if (recordsToMark.length === 0) {
      toast.info("All teachers already marked");
      return;
    }

    const result = await bulkMarkAttendance(recordsToMark, profile.id, branchId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Marked ${recordsToMark.length} teachers as present`);
      router.refresh();
    }
  };

  const handlePeriodOverride = async () => {
    if (!selectedSlot) return;

    const formData = new FormData();
    formData.append("timetable_slot_id", selectedSlot.id);
    formData.append("date", selectedDate || "");
    formData.append("override_type", overrideType);
    if (overrideType === "substitute" && substituteTeacherId) {
      formData.append("substitute_teacher_id", substituteTeacherId);
    }
    formData.append("reason", periodReason);

    const result = await savePeriodOverride(formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Period override saved");
      setPeriodDialogOpen(false);
      setSelectedSlot(null);
      setOverrideType("substitute");
      setSubstituteTeacherId("");
      setPeriodReason("");
      router.refresh();
    }
  };

  const calendarDays = getCalendarDays();
  const todayDate = getTodayDate();
  const targetTeacherId =
    role === "teacher" ? profile?.id : selectedTeacherId || teachers[0]?.id;

  const stats = targetTeacherId ? getAttendanceStats(targetTeacherId) : null;

  return (
    <div className="flex gap-6 h-full">
      {/* Left Panel - Calendar and Stats */}
      <div className="w-80 space-y-6">
        {/* Month Navigation */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newMonth = currentMonth === 1 ? 12 : currentMonth - 1;
                const newYear = currentMonth === 1 ? currentYear - 1 : currentYear;
                const params = new URLSearchParams();
                params.set("month", String(newMonth));
                params.set("year", String(newYear));
                if (selectedTeacherId) params.set("teacher", selectedTeacherId);
                router.push(`?${params.toString()}`);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <div className="font-semibold">
                {MONTHS[currentMonth - 1]} {currentYear}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newMonth = currentMonth === 12 ? 1 : currentMonth + 1;
                const newYear = currentMonth === 12 ? currentYear + 1 : currentYear;
                const params = new URLSearchParams();
                params.set("month", String(newMonth));
                params.set("year", String(newYear));
                if (selectedTeacherId) params.set("teacher", selectedTeacherId);
                router.push(`?${params.toString()}`);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="bg-card rounded-lg border p-3">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const date = formatDate(day);
                const isFuture = new Date(date) > new Date();
                const isWeekend = new Date(date).getDay() === 0 || new Date(date).getDay() === 6;
                const attendance = targetTeacherId ? getAttendanceStatus(targetTeacherId, date) : null;
                const isSelected = selectedDate === date;

                let indicatorColor = "bg-gray-300";
                if (!isFuture && !isWeekend) {
                  if (attendance?.status === "present") indicatorColor = "bg-green-500";
                  else if (attendance?.status === "absent") indicatorColor = "bg-red-500";
                  else if (attendance?.status === "late") indicatorColor = "bg-amber-500";
                  else if (attendance?.status === "half_day") indicatorColor = "bg-gradient-to-r from-amber-500 to-green-500";
                  else indicatorColor = "bg-gray-400";
                }

                return (
                  <button
                    key={day}
                    onClick={() => !isWeekend && !isFuture && setSelectedDate(date)}
                    className={cn(
                      "aspect-square rounded border text-sm flex flex-col items-center justify-center relative",
                      isSelected && "border-brand bg-brand/10",
                      !isSelected && "border-border hover:border-foreground/50",
                      isWeekend && "bg-muted text-muted-foreground",
                      isFuture && "text-muted-foreground"
                    )}
                  >
                    <span className={cn(
                      "font-semibold",
                      date === todayDate && "text-brand text-base"
                    )}>
                      {day}
                    </span>
                    {!isWeekend && !isFuture && (
                      <div className={cn("h-1.5 w-1.5 rounded-full mt-0.5", indicatorColor)} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="bg-card rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Monthly Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Present</span>
                <Badge variant="outline" className="bg-green-500/10 text-green-700">
                  {stats.present}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Absent</span>
                <Badge variant="outline" className="bg-red-500/10 text-red-700">
                  {stats.absent}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Late</span>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-700">
                  {stats.late}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Half Day</span>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-700">
                  {stats.halfDay}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Details */}
      <div className="flex-1">
        {isTeacher ? (
          <TeacherMarkingView
            profile={profile}
            todayDate={todayDate}
            attendance={getAttendanceStatus(profile.id, todayDate)}
            onMark={handleMarkAttendance}
          />
        ) : (
          <AdminView
            teachers={teachers}
            todayDate={todayDate}
            selectedDate={selectedDate}
            selectedTeacherId={selectedTeacherId}
            attendance={attendance}
            timetableSlots={timetableSlots}
            periodOverrides={periodOverrides}
            onBulkMarkPresent={handleBulkMarkPresent}
            onSelectTeacher={(teacherId) => {
              const params = new URLSearchParams();
              params.set("month", String(currentMonth));
              params.set("year", String(currentYear));
              params.set("teacher", teacherId);
              router.push(`?${params.toString()}`);
            }}
            onSelectDate={(date) => setSelectedDate(date)}
            onOpenAttendanceModal={(teacherId) => {
              setAttendanceModalTeacher(teacherId);
              setAttendanceModalOpen(true);
            }}
            onHandlePeriod={(slot) => {
              setSelectedSlot(slot);
              setSelectedAbsentTeacher(slot.teacher_id);
              setPeriodDialogOpen(true);
            }}
          />
        )}
      </div>

      {/* Attendance Modal */}
      {attendanceModalTeacher && (
        <AttendanceModal
          open={attendanceModalOpen}
          onOpenChange={setAttendanceModalOpen}
          teacherId={attendanceModalTeacher}
          teacherName={teachers.find((t) => t.id === attendanceModalTeacher)?.name || ""}
          date={selectedDate || todayDate}
          currentStatus={
            localAttendance.find(
              (a) => a.teacher_id === attendanceModalTeacher && a.date === (selectedDate || todayDate)
            )?.status as "present" | "absent" | "late" | "half_day" | undefined
          }
          currentReason={
            localAttendance.find(
              (a) => a.teacher_id === attendanceModalTeacher && a.date === (selectedDate || todayDate)
            )?.reason ?? undefined
          }
          markedBy={profile.id}
          branchId={branchId}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}

      {/* Period Override Dialog */}
      <Dialog open={periodDialogOpen} onOpenChange={setPeriodDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Handle Period Override</DialogTitle>
            <DialogDescription>
              Set substitute or cancel this period
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={overrideType} onValueChange={(val: any) => setOverrideType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="substitute">Assign Substitute</SelectItem>
                  <SelectItem value="cancel">Cancel Period</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {overrideType === "substitute" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Substitute Teacher</label>
                <Select value={substituteTeacherId} onValueChange={setSubstituteTeacherId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                placeholder="Enter reason for override"
                value={periodReason}
                onChange={(e) => setPeriodReason(e.target.value)}
                className="min-h-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPeriodDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePeriodOverride}>Save Override</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Teacher View Component
function TeacherMarkingView({
  profile,
  todayDate,
  attendance,
  onMark,
}: {
  profile: any;
  todayDate: string;
  attendance: TeacherAttendance | undefined;
  onMark: (teacherId: string, date: string, status: any, reason?: string) => Promise<void>;
}) {
  const [selectedStatus, setSelectedStatus] = useState<"present" | "absent" | "late" | "half_day" | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedStatus) {
      toast.error("Please select attendance status");
      return;
    }
    if ((selectedStatus === "absent" || selectedStatus === "late") && !reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    setIsSubmitting(true);
    try {
      await onMark(profile.id, todayDate, selectedStatus, reason);
      setSelectedStatus(null);
      setReason("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mark Your Attendance</h2>
        <p className="text-muted-foreground">You can only mark attendance for today</p>
      </div>

      {attendance ? (
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">Today's Attendance</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge className={cn(
                "capitalize",
                attendance.status === "present" && "bg-green-500",
                attendance.status === "absent" && "bg-red-500",
                attendance.status === "late" && "bg-amber-500",
                attendance.status === "half_day" && "bg-purple-500"
              )}>
                {attendance.status.replace("_", " ")}
              </Badge>
            </div>
            {attendance.reason && (
              <div>
                <span className="text-sm text-muted-foreground">Reason:</span>
                <p className="text-sm">{attendance.reason}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-card border rounded-lg p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">Status</label>
            <div className="grid grid-cols-2 gap-3">
              {(["present", "absent", "late", "half_day"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={cn(
                    "p-3 rounded border text-sm font-medium transition",
                    selectedStatus === status
                      ? "border-brand bg-brand/10"
                      : "border-border hover:border-foreground/50"
                  )}
                >
                  {status === "half_day" ? "Half Day" : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {(selectedStatus === "absent" || selectedStatus === "late") && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason *</label>
              <Textarea
                placeholder="Please provide a reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-20"
              />
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedStatus}
            className="w-full"
          >
            {isSubmitting ? "Marking..." : "Mark Attendance"}
          </Button>
        </div>
      )}
    </div>
  );
}

// Admin View Component
function AdminView({
  teachers,
  todayDate,
  selectedDate,
  selectedTeacherId,
  attendance,
  timetableSlots,
  periodOverrides,
  onBulkMarkPresent,
  onSelectTeacher,
  onSelectDate,
  onOpenAttendanceModal,
  onHandlePeriod,
}: {
  teachers: Teacher[];
  todayDate: string;
  selectedDate: string | null;
  selectedTeacherId: string | null;
  attendance: TeacherAttendance[];
  timetableSlots: TimetableSlot[];
  periodOverrides: PeriodOverride[];
  onBulkMarkPresent: () => Promise<void>;
  onSelectTeacher: (teacherId: string) => void;
  onSelectDate: (date: string) => void;
  onOpenAttendanceModal: (teacherId: string) => void;
  onHandlePeriod: (slot: any) => void;
}) {
  const displayDate = selectedDate || todayDate;
  const dateObj = new Date(displayDate);
  const formattedDate = dateObj.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const attendanceForDate = attendance.filter((a) => a.date === displayDate);
  const attendanceMap = new Map(attendanceForDate.map((a) => [a.teacher_id, a]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Attendance Management</h2>
        <p className="text-muted-foreground">{formattedDate}</p>
      </div>

      {selectedDate === todayDate && (
        <div className="flex gap-2">
          <Button onClick={onBulkMarkPresent} variant="outline">
            Mark all as present
          </Button>
        </div>
      )}

      <div className="bg-card border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-semibold">Teacher</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Reason</th>
                <th className="text-right p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => {
                const att = attendanceMap.get(teacher.id);
                return (
                  <tr key={teacher.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">{teacher.name}</td>
                    <td className="p-4">
                      {att ? (
                        <Badge className={cn(
                          "capitalize",
                          att.status === "present" && "bg-green-500",
                          att.status === "absent" && "bg-red-500",
                          att.status === "late" && "bg-amber-500",
                          att.status === "half_day" && "bg-purple-500"
                        )}>
                          {att.status.replace("_", " ")}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Not marked</span>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">{att?.reason || "-"}</td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenAttendanceModal(teacher.id)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Absent teachers - show periods for handling */}
      {attendanceForDate.filter((a) => a.status === "absent").length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Handle Absent Teacher Periods</h3>
          {attendanceForDate
            .filter((a) => a.status === "absent")
            .map((att) => {
              const teacherSlots = timetableSlots.filter((ts) => ts.teacher_id === att.teacher_id);
              return (
                <div key={att.id} className="border rounded-lg p-4 space-y-3">
                  <div className="font-medium">{teachers.find((t) => t.id === att.teacher_id)?.name}</div>
                  <div className="space-y-2">
                    {teacherSlots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                        <span>Period (Division)</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onHandlePeriod(slot)}
                        >
                          Handle
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
