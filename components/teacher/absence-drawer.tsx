"use client";

import { useState } from "react";
import { Trash2, ArrowRight, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { markAbsence, deleteAbsence } from "@/lib/actions/teacher";

interface Teacher {
  id: string;
  name: string;
}

interface Absence {
  id: string;
  teacher_id: string;
  substitute_teacher_id: string;
  absence_date: string;
  reason: string | null;
  marked_by: string;
}

interface AbsenceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTeacherId: string;
  selectedTeacherName: string;
  allTeachers: Teacher[];
  absences: Absence[];
  loggedBy: string;
}

export function AbsenceDrawer({
  open,
  onOpenChange,
  selectedTeacherId,
  selectedTeacherName,
  allTeachers,
  absences,
  loggedBy,
}: AbsenceDrawerProps) {
  const [absenceDate, setAbsenceDate] = useState("");
  const [substituteTeacherId, setSubstituteTeacherId] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingAbsenceId, setLoadingAbsenceId] = useState<string | null>(null);

  const filteredTeachers = allTeachers.filter((t) => t.id !== selectedTeacherId);
  const relevantAbsences = absences.filter((a) => a.teacher_id === selectedTeacherId);

  const handleMarkAbsence = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!absenceDate || !substituteTeacherId) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("teacher_id", selectedTeacherId);
      formData.set("substitute_teacher_id", substituteTeacherId);
      formData.set("absence_date", absenceDate);
      formData.set("reason", reason);
      formData.set("marked_by", loggedBy);

      const result = await markAbsence(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Absence marked successfully");
        setAbsenceDate("");
        setSubstituteTeacherId("");
        setReason("");
      }
    } catch (error) {
      toast.error("Failed to mark absence");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAbsence = async (absence: Absence) => {
    setLoadingAbsenceId(absence.id);
    try {
      const result = await deleteAbsence(
        absence.id,
        absence.teacher_id,
        absence.substitute_teacher_id,
        absence.absence_date
      );

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Absence deleted");
      }
    } catch (error) {
      toast.error("Failed to delete absence");
    } finally {
      setLoadingAbsenceId(null);
    }
  };

  const substituteNames = new Map(allTeachers.map((t) => [t.id, t.name]));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-96 flex flex-col">
        <SheetHeader>
          <SheetTitle>Mark Absence</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-4">
          {/* Form */}
          <form onSubmit={handleMarkAbsence} className="space-y-3">
            <div>
              <label className="text-xs font-medium block mb-1">Teacher</label>
              <div className="text-sm font-medium p-2 bg-muted rounded">
                {selectedTeacherName}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">Absence Date *</label>
              <Input
                type="date"
                value={absenceDate}
                onChange={(e) => setAbsenceDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">Substitute Teacher *</label>
              <Select value={substituteTeacherId} onValueChange={setSubstituteTeacherId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select substitute" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">Reason</label>
              <Textarea
                placeholder="Optional"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-16 resize-none text-xs"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !absenceDate || !substituteTeacherId}
              className="w-full h-8 text-xs bg-[#ba2032] hover:bg-[#ba2032]/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Marking...
                </>
              ) : (
                "Mark Absence"
              )}
            </Button>
          </form>

          {/* This week absences */}
          <div className="border-t pt-3">
            <h4 className="text-xs font-medium uppercase mb-2" style={{ color: "#A3A3A3" }}>
              This week
            </h4>
            {relevantAbsences.length === 0 ? (
              <p className="text-xs" style={{ color: "#A3A3A3" }}>
                No absences this week
              </p>
            ) : (
              <div className="space-y-2">
                {relevantAbsences.map((absence) => {
                  const substituteDate = new Date(absence.absence_date);
                  const dateStr = substituteDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <div key={absence.id} className="text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <span className="font-medium truncate">{selectedTeacherName}</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                        <span className="truncate">{substituteNames.get(absence.substitute_teacher_id)}</span>
                      </div>
                      <span className="text-muted-foreground shrink-0">{dateStr}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 shrink-0"
                        onClick={() => handleDeleteAbsence(absence)}
                        disabled={loadingAbsenceId === absence.id}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
