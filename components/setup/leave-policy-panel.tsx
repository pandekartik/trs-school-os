"use client";

import { useState } from "react";
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
import { createLeavePolicy, updateLeavePolicy } from "@/lib/actions/setup";

type Props = {
  policy: LeavePolicy | null;
  activeYearId: string;
  onClose: () => void;
};

const leaveTypeOptions = [
  { value: "sick", label: "Sick Leave" },
  { value: "casual", label: "Casual Leave" },
  { value: "emergency", label: "Emergency Leave" },
  { value: "official", label: "Official Duty" },
];

const defaultNames: Record<string, string> = {
  sick: "Sick Leave",
  casual: "Casual Leave",
  emergency: "Emergency Leave",
  official: "Official Duty",
};

export function LeavePolicyPanel({ policy, activeYearId, onClose }: Props) {
  const isEditMode = policy !== null;
  const [leaveType, setLeaveType] = useState(policy?.leave_type ?? "");
  const [name, setName] = useState(policy?.name ?? "");
  const [daysAllowed, setDaysAllowed] = useState(policy?.days_allowed.toString() ?? "");
  const [isPaid, setIsPaid] = useState(policy?.is_paid ?? true);
  const [requiresDocument, setRequiresDocument] = useState(policy?.requires_document ?? false);
  const [loading, setLoading] = useState(false);

  function handleLeaveTypeChange(value: string) {
    setLeaveType(value);
    setName(defaultNames[value]);
  }

  function validateForm(): boolean {
    if (!leaveType || !name || !daysAllowed) {
      toast.error("Please fill in all required fields");
      return false;
    }
    const days = parseInt(daysAllowed);
    if (isNaN(days) || days < 0 || days > 365) {
      toast.error("Days allowed must be between 0 and 365");
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("school_year_id", activeYearId);
      formData.append("leave_type", leaveType);
      formData.append("name", name);
      formData.append("days_allowed", daysAllowed);
      formData.append("is_paid", isPaid.toString());
      formData.append("requires_document", requiresDocument.toString());

      const result = isEditMode
        ? await updateLeavePolicy(policy!.id, formData)
        : await createLeavePolicy(formData);

      if (result?.error) {
        toast.error(isEditMode ? "Save failed" : "Add failed", { description: result.error });
      } else {
        toast.success(isEditMode ? "Leave type updated successfully" : "Leave type added successfully");
        onClose();
        window.location.reload();
      }
    } catch {
      toast.error(isEditMode ? "Error updating leave type" : "Error adding leave type");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white border-l border-border shadow-lg flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">
            {isEditMode ? "Edit leave type" : "Add leave type"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="size-8 p-0"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="leave-type" className="text-xs font-medium uppercase">Leave Type</Label>
              <Select value={leaveType} onValueChange={handleLeaveTypeChange}>
                <SelectTrigger id="leave-type">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isEditMode && (
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase">Leave Type</Label>
              <div className="px-3 py-2 rounded border border-border bg-muted text-sm">
                <span className="font-mono text-[11px] text-muted-foreground uppercase">{policy?.leave_type}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-medium uppercase">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sick Leave, Casual Leave"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="days" className="text-xs font-medium uppercase">Days Allowed Per Year</Label>
            <Input
              id="days"
              type="number"
              min="0"
              max="365"
              value={daysAllowed}
              onChange={(e) => setDaysAllowed(e.target.value)}
              placeholder="12"
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <input
                id="is-paid"
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="w-4 h-4 rounded border border-border cursor-pointer"
              />
              <Label htmlFor="is-paid" className="text-sm font-medium cursor-pointer flex-1">
                <span>Paid Leave</span>
                <p className="text-xs text-muted-foreground font-normal mt-1">Teacher salary is not deducted for paid leave</p>
              </Label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                id="requires-doc"
                type="checkbox"
                checked={requiresDocument}
                onChange={(e) => setRequiresDocument(e.target.checked)}
                className="w-4 h-4 rounded border border-border cursor-pointer"
              />
              <Label htmlFor="requires-doc" className="text-sm font-medium cursor-pointer flex-1">
                <span>Requires Document</span>
                <p className="text-xs text-muted-foreground font-normal mt-1">Teacher must submit supporting document for this leave type</p>
              </Label>
            </div>
          </div>
        </div>

        <div className="border-t border-border px-6 py-4">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {isEditMode ? "Saving..." : "Adding..."}
              </>
            ) : (
              isEditMode ? "Save changes" : "Add leave type"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
