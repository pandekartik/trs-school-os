"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { LeavePolicy } from "@/lib/types";
import { applyForLeave } from "@/lib/actions/teacher";
import { parseDateOnly } from "@/lib/utils/date";

type Props = {
  teacherId: string;
  branchId: string | null;
  schoolYearId: string;
  policies: LeavePolicy[];
  onClose: () => void;
};

export function LeaveApplyPanel({ teacherId, branchId, schoolYearId, policies, onClose }: Props) {
  const [leaveType, setLeaveType] = useState<string>(policies[0]?.leave_type ?? "");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const totalDays =
    fromDate && toDate
      ? Math.max(
          1,
          Math.round(
            (parseDateOnly(toDate).getTime() - parseDateOnly(fromDate).getTime()) / 86400000
          ) + 1
        )
      : 0;

  async function handleSubmit() {
    if (!leaveType || !fromDate || !toDate || !reason.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (toDate < fromDate) {
      toast.error("End date must be on or after start date");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("teacher_id", teacherId);
      formData.append("school_year_id", schoolYearId);
      if (branchId) formData.append("branch_id", branchId);
      formData.append("leave_type", leaveType);
      formData.append("from_date", fromDate);
      formData.append("to_date", toDate);
      formData.append("total_days", String(totalDays));
      formData.append("reason", reason.trim());

      const result = await applyForLeave(formData);
      if (result?.error) {
        toast.error("Could not submit request", { description: result.error });
      } else {
        toast.success("Leave request submitted");
        onClose();
        window.location.reload();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-surface border-l border-border shadow-xl animate-in slide-in-from-right flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="text-xl font-semibold tracking-tight">Apply for leave</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="size-8 -mr-2">
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {policies.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No leave types have been configured for this school year yet.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Leave type</Label>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {policies.map((p) => (
                      <SelectItem key={p.id} value={p.leave_type}>
                        {p.name} ({p.days_allowed} days/year)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="from-date" className="text-sm font-medium">From date</Label>
                <Input
                  id="from-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="to-date" className="text-sm font-medium">To date</Label>
                <Input
                  id="to-date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-11"
                />
              </div>

              {totalDays > 0 && (
                <p className="text-xs text-muted-foreground">{totalDays} day(s) requested</p>
              )}

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-sm font-medium">Reason</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Briefly describe the reason for leave"
                  rows={4}
                />
              </div>
            </>
          )}
        </div>

        <div className="border-t border-border px-6 py-4 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || policies.length === 0} className="min-w-[120px]">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit request"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
