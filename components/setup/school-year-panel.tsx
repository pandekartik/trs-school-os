"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SchoolYear } from "@/lib/types";
import { createSchoolYear, updateSchoolYear } from "@/lib/actions/setup";

type Props = {
  mode: "add" | "edit";
  year: SchoolYear | null;
  onClose: () => void;
};

export function SchoolYearPanel({ mode, year, onClose }: Props) {
  const [name, setName] = useState(year?.name || "");
  const [startDate, setStartDate] = useState(year?.start_date || "");
  const [endDate, setEndDate] = useState(year?.end_date || "");
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  function validateForm(): boolean {
    if (!name || !startDate || !endDate) {
      toast.error("Please fill in all fields");
      return false;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      toast.error("Start date must be before end date");
      return false;
    }
    return true;
  }

  async function executeAddYear() {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("start_date", startDate);
      formData.append("end_date", endDate);
      const result = await createSchoolYear(formData);

      if (result?.error) {
        toast.error("Add failed", { description: result.error });
      } else {
        toast.success("School year added successfully");
        onClose();
        window.location.reload();
      }
    } catch (err) {
      toast.error("Error adding school year");
    } finally {
      setLoading(false);
    }
  }

  async function executeEditYear() {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("start_date", startDate);
      formData.append("end_date", endDate);
      const result = await updateSchoolYear(year!.id, formData);

      if (result?.error) {
        toast.error("Save failed", { description: result.error });
      } else {
        toast.success("School year updated successfully");
        onClose();
        window.location.reload();
      }
    } catch (err) {
      toast.error("Error updating school year");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmAction() {
    if (mode === "add") {
      await executeAddYear();
    } else {
      await executeEditYear();
    }
    setConfirmDialogOpen(false);
  }

  const handleSubmit = () => {
    if (!validateForm()) return;
    setConfirmDialogOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-surface border-l border-border shadow-xl animate-in slide-in-from-right flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex-1">
            <h2 className="text-xl font-semibold tracking-tight">
              {mode === "add" ? "Add school year" : "Edit school year"}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 -mr-2"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">School year name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 2024-2025"
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-date" className="text-sm font-medium">Start date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date" className="text-sm font-medium">End date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="h-11"
            />
          </div>
        </div>

        <div className="border-t border-border px-6 py-4 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {mode === "add" ? "Adding..." : "Saving..."}
              </>
            ) : mode === "add" ? (
              "Add year"
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Add School Year" : "Save Changes"}</DialogTitle>
            <DialogDescription>
              {mode === "add"
                ? `Are you sure you want to add ${name}?`
                : `Are you sure you want to update ${name}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {mode === "add" ? "Adding..." : "Saving..."}
                </>
              ) : mode === "add" ? (
                "Add Year"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
