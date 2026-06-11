"use client";

import { useState, useMemo } from "react";
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
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { LeavePolicy } from "@/lib/types";
import { applyForLeave } from "@/lib/actions/teacher";

function countWeekdays(fromDate: string, toDate: string): number {
  if (!fromDate || !toDate) return 0;

  const start = new Date(fromDate);
  const end = new Date(toDate);

  if (start > end) return 0;

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    // Monday=1, Friday=5 (exclude 0=Sunday, 6=Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = {
  policies: LeavePolicy[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  balances: any[];
  teacherId: string;
  schoolYearId: string;
  branchId: string | null;
  onClose: () => void;
};

export function LeaveApplyPanel({
  policies,
  balances,
  teacherId,
  schoolYearId,
  branchId,
  onClose,
}: Props) {
  const [leaveType, setLeaveType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const totalDays = useMemo(() => countWeekdays(fromDate, toDate), [fromDate, toDate]);

  const selectedPolicy = policies.find((p) => p.leave_type === leaveType);
  const selectedBalance = balances.find((b) => b.leave_type === leaveType);
  const remainingDays = selectedPolicy
    ? selectedPolicy.days_allowed - (selectedBalance?.used_days ?? 0)
    : 0;

  const isOverLimit = totalDays > remainingDays;

  function validateForm(): boolean {
    if (!leaveType || !fromDate || !toDate || !reason.trim()) {
      toast.error("Please fill in all fields");
      return false;
    }
    if (totalDays === 0) {
      toast.error("Please select valid dates");
      return false;
    }
    if (isOverLimit) {
      toast.error("Insufficient leave balance");
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("teacher_id", teacherId);
      formData.append("school_year_id", schoolYearId);
      formData.append("branch_id", branchId || "");
      formData.append("leave_type", leaveType);
      formData.append("from_date", fromDate);
      formData.append("to_date", toDate);
      formData.append("total_days", totalDays.toString());
      formData.append("reason", reason);

      const result = await applyForLeave(formData);

      if (result?.error) {
        toast.error("Application failed", { description: result.error });
      } else {
        toast.success("Leave request submitted successfully");
        onClose();
        window.location.reload();
      }
    } catch {
      toast.error("Error submitting leave request");
    } finally {
      setSaving(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white border-l border-border shadow-lg flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Apply for leave</h2>
          <Button variant="ghost" size="sm" className="size-8 p-0" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="leave-type" className="text-xs font-medium uppercase">
              Leave Type
            </Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger id="leave-type">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {policies.map((policy) => {
                  const balance = balances.find((b) => b.leave_type === policy.leave_type);
                  const remaining = policy.days_allowed - (balance?.used_days ?? 0);
                  return (
                    <SelectItem key={policy.leave_type} value={policy.leave_type}>
                      {policy.name} ({remaining} days remaining)
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="from-date" className="text-xs font-medium uppercase">
              From Date
            </Label>
            <Input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              min={today}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="to-date" className="text-xs font-medium uppercase">
              To Date
            </Label>
            <Input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              min={fromDate || today}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase">Total Days</Label>
            <div className="px-3 py-2 rounded border border-border bg-muted text-sm text-muted-foreground">
              {totalDays} {totalDays === 1 ? "day" : "days"}
            </div>
          </div>

          {isOverLimit && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              Insufficient balance. You have {remainingDays} days remaining for this leave type.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-xs font-medium uppercase">
              Reason
            </Label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe the reason for your leave request"
              className="w-full px-3 py-2 text-sm border border-border rounded resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="border-t border-border px-6 py-4">
          <Button
            onClick={handleSubmit}
            disabled={saving || isOverLimit || !reason.trim()}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit application"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
