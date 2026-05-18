"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface AbsencePanelProps {
  selectedTeacherId: string;
  selectedTeacherName: string;
  allTeachers: Teacher[];
  absences: Absence[];
  loggedBy: string;
}

export function AbsencePanel({
  selectedTeacherId,
  selectedTeacherName,
  allTeachers,
  absences,
  loggedBy,
}: AbsencePanelProps) {
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
    <Card className="sticky top-0">
      <CardHeader>
        <CardTitle className="text-base">Mark Absence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
            {isSubmitting ? "Marking..." : "Mark Absence"}
          </Button>
        </form>

        {/* Recent absences */}
        {relevantAbsences.length > 0 && (
          <div className="border-t pt-3">
            <h4 className="text-xs font-semibold mb-2">Recent Absences</h4>
            <div className="space-y-2">
              {relevantAbsences.map((absence) => {
                const substituteDate = new Date(absence.absence_date);
                const dateStr = substituteDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });

                return (
                  <div key={absence.id} className="text-xs bg-muted rounded p-2">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <div className="font-medium">{dateStr}</div>
                        <div className="text-muted-foreground">
                          Sub: {substituteNames.get(absence.substitute_teacher_id)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleDeleteAbsence(absence)}
                        disabled={loadingAbsenceId === absence.id}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    {absence.reason && (
                      <div className="text-muted-foreground text-xs">{absence.reason}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
