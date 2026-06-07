"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Branch } from "@/lib/types";
import { createBranch, updateBranch } from "@/lib/actions/setup";

type Props = {
  mode: "add" | "edit";
  branch: Branch | null;
  onClose: () => void;
};

export function BranchPanel({ mode, branch, onClose }: Props) {
  const [name, setName] = useState(branch?.name || "");
  const [city, setCity] = useState(branch?.city || "");
  const [isActive, setIsActive] = useState(branch?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  function validateAddBranch(): boolean {
    if (!name || !city) {
      toast.error("Please fill in all fields");
      return false;
    }
    return true;
  }

  async function executeAddBranch() {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("city", city);
      const result = await createBranch(formData);

      if (result?.error) {
        toast.error("Add failed", { description: result.error });
      } else {
        toast.success("Branch added successfully");
        onClose();
        window.location.reload();
      }
    } catch (err) {
      toast.error("Error adding branch");
    } finally {
      setLoading(false);
    }
  }

  function handleAddBranch() {
    if (!validateAddBranch()) return;
    setConfirmDialogOpen(true);
  }

  async function executeEditBranch() {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("city", city);
      formData.append("is_active", String(isActive));
      const result = await updateBranch(branch!.id, formData);

      if (result?.error) {
        toast.error("Save failed", { description: result.error });
      } else {
        toast.success("Branch updated successfully");
        onClose();
        window.location.reload();
      }
    } catch (err) {
      toast.error("Error updating branch");
    } finally {
      setLoading(false);
    }
  }

  function handleEditBranch() {
    if (!validateAddBranch()) return;
    setConfirmDialogOpen(true);
  }

  async function handleConfirmAction() {
    if (mode === "add") {
      await executeAddBranch();
    } else {
      await executeEditBranch();
    }
    setConfirmDialogOpen(false);
  }

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
              {mode === "add" ? "Add branch" : "Edit branch"}
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
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Branch name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Main Campus"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Mumbai"
                required
                className="h-11"
              />
            </div>

            {mode === "edit" && (
              <div className="border-t border-border pt-6">
                <div className="flex items-center justify-between p-4 bg-surface-2 rounded-xl">
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-xs text-muted-foreground mt-1">{isActive ? "Active" : "Inactive"}</p>
                  </div>
                  <button
                    onClick={() => setIsActive(!isActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      isActive ? "bg-green-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        isActive ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
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
            onClick={mode === "add" ? handleAddBranch : handleEditBranch}
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {mode === "add" ? "Adding..." : "Saving..."}
              </>
            ) : mode === "add" ? (
              "Add branch"
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Add New Branch" : "Save Changes"}</DialogTitle>
            <DialogDescription>
              {mode === "add"
                ? `Are you sure you want to add ${name}? It will be available in the system immediately.`
                : `Are you sure you want to update ${name}'s details? These changes will take effect immediately.`}
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
                "Add Branch"
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
