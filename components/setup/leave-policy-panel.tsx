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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { LeavePolicy } from "@/lib/types";
import { createLeavePolicy, updateLeavePolicy } from "@/lib/actions/setup";

type Props = {
  mode: "add" | "edit";
  policy: LeavePolicy | null;
  schoolYearId: string;
  onClose: () => void;
};

const LEAVE_TYPES = ["sick", "casual", "emergency", "official"] as const;

export function LeavePolicyPanel({ mode, policy, schoolYearId, onClose }: Props) {
  const [leaveType, setLeaveType] = useState<(typeof LEAVE_TYPES)[number]>(policy?.leave_type || "casual");
  const [name, setName] = useState(policy?.name || "");
  const [daysAllowed, setDaysAllowed] = useState(policy ? String(policy.days_allowed) : "");
  const [isPaid, setIsPaid] = useState(policy?.is_paid ?? true);
  const [requiresDocument, setRequiresDocument] = useState(policy?.requires_document ?? false);
  const [loading, setLoading] = useState(false);

  function validateForm(): boolean {
    if (!name || !daysAllowed) {
      toast.error("Please fill in all fields");
      return false;
    }
    if (parseInt(daysAllowed) < 0) {
      toast.error("Days allowed cannot be negative");
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("school_year_id", schoolYearId);
      formData.append("leave_type", leaveType);
      formData.append("name", name);
      formData.append("days_allowed", daysAllowed);
      formData.append("is_paid", String(isPaid));
      formData.append("requires_document", String(requiresDocument));

      const result =
        mode === "add"
          ? await createLeavePolicy(formData)
          : await updateLeavePolicy(policy!.id, formData);

      if (result?.error) {
        toast.error(mode === "add" ? "Add failed" : "Save failed", { description: result.error });
      } else {
        toast.success(mode === "add" ? "Leave policy added" : "Leave policy updated");
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
          <h2 className="text-xl font-semibold tracking-tight">
            {mode === "add" ? "Add leave policy" : "Edit leave policy"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="size-8 -mr-2">
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Leave type</Label>
            <Select
              value={leaveType}
              onValueChange={(v) => setLeaveType(v as (typeof LEAVE_TYPES)[number])}
              disabled={mode === "edit"}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Policy name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Casual Leave"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="days" className="text-sm font-medium">Days allowed per year</Label>
            <Input
              id="days"
              type="number"
              min={0}
              value={daysAllowed}
              onChange={(e) => setDaysAllowed(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="paid" className="text-sm font-medium">Paid leave</Label>
            <input
              id="paid"
              type="checkbox"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              className="size-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="document" className="text-sm font-medium">Requires document</Label>
            <input
              id="document"
              type="checkbox"
              checked={requiresDocument}
              onChange={(e) => setRequiresDocument(e.target.checked)}
              className="size-4"
            />
          </div>
        </div>

        <div className="border-t border-border px-6 py-4 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="min-w-[120px]">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {mode === "add" ? "Adding..." : "Saving..."}
              </>
            ) : mode === "add" ? (
              "Add policy"
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
