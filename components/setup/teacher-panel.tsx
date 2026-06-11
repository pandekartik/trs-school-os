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
import type { Teacher, Branch } from "@/lib/types";
import { createTeacher, updateTeacher } from "@/lib/actions/setup";

type Props = {
  mode: "add" | "edit";
  teacher: Teacher | null;
  onClose: () => void;
  branches?: Branch[];
  showBranchSelect?: boolean;
  activeSchoolYear?: string | null;
  branches?: Branch[] | null;
};

<<<<<<< Updated upstream
export function TeacherPanel({ mode, teacher, onClose, branches = [], showBranchSelect = false, activeSchoolYear }: Props) {
=======
export function TeacherPanel({ mode, teacher, onClose, activeSchoolYear, branches }: Props) {
>>>>>>> Stashed changes
  const [name, setName] = useState(teacher?.name || "");
  const [email, setEmail] = useState(teacher?.email || "");
  const [phone, setPhone] = useState(teacher?.phone || "");
  const [branchId, setBranchId] = useState(teacher?.branch_id || "");
  const [isActive, setIsActive] = useState(teacher?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  function getFirstName(fullName: string): string {
    return fullName.split(" ")[0];
  }

  function generatePassword(): string {
    const firstName = getFirstName(name).trim();
    if (!firstName || !activeSchoolYear) return "";
    // Title case the first name and append @schoolyear
    const titleCaseName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    const year = activeSchoolYear.split("-")[0] || activeSchoolYear;
    return `${titleCaseName}@${year}`;
  }

  function validateForm(): boolean {
    if (!name || !email) {
      toast.error("Name and email are required");
      return false;
    }
    if (mode === "add" && !email.includes("@")) {
      toast.error("Please enter a valid email");
      return false;
    }
    if (mode === "add" && !branchId) {
      toast.error("Please select a branch");
      return false;
    }
    return true;
  }

  async function executeAddTeacher() {
    setLoading(true);
    try {
      const password = generatePassword();
      if (!password) {
        toast.error("Could not generate password. Please try again.");
        setLoading(false);
        return;
      }

      // First create the teacher record (this will check for duplicate email)
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("branch_id", branchId || "");
      formData.append("role", "teacher");
      formData.append("branch_id", branchId);

      const result = await createTeacher(formData);

      if (result?.error) {
        toast.error("Add failed", { description: result.error });
        setLoading(false);
        return;
      }

      // Only create auth account after teacher record is created
      const authResponse = await fetch("/api/admin/invite-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          role: "teacher",
          password,
        }),
      });

      if (!authResponse.ok) {
        const error = await authResponse.json();
        toast.error("Account creation failed", { description: error.error });
        setLoading(false);
        return;
      }

      setGeneratedPassword(password);
      toast.success("Teacher added successfully with login credentials");
      onClose();
      window.location.reload();
    } catch (err) {
      toast.error("Error adding teacher");
    } finally {
      setLoading(false);
    }
  }

  async function executeEditTeacher() {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("branch_id", branchId || "");
      formData.append("role", "teacher");
      formData.append("is_active", String(isActive));
      if (showBranchSelect && branchId) {
        formData.append("branch_id", branchId);
      }

      const result = await updateTeacher(teacher!.id, formData);

      if (result?.error) {
        toast.error("Save failed", { description: result.error });
      } else {
        toast.success("Teacher updated successfully");
        onClose();
        window.location.reload();
      }
    } catch (err) {
      toast.error("Error updating teacher");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmAction() {
    if (mode === "add") {
      await executeAddTeacher();
    } else {
      await executeEditTeacher();
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
              {mode === "add" ? "Add teacher" : "Edit teacher"}
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
            <Label htmlFor="name" className="text-sm font-medium">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ms. Sharma"
              required
              className="h-11"
            />
          </div>

          {mode === "add" && (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@trs.edu"
                required
                className="h-11"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">Phone number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="h-11"
            />
          </div>

<<<<<<< Updated upstream
          {mode === "add" && (
            <div className="space-y-2">
              <Label htmlFor="branch" className="text-sm font-medium">
                Branch <span className="text-destructive">*</span>
              </Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} · {branch.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
=======
          <div className="space-y-2">
            <Label htmlFor="branch" className="text-sm font-medium">Branch</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger id="branch" className="h-11">
                <SelectValue placeholder="Select a branch" />
              </SelectTrigger>
              <SelectContent>
                {branches && branches.length > 0 ? (
                  branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    No branches available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
>>>>>>> Stashed changes

          {mode === "add" && activeSchoolYear && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs font-medium text-blue-900 mb-2">Auto-generated Login Credentials</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-blue-700">Email:</p>
                  <code className="text-sm font-mono text-blue-900">{email || "-"}</code>
                </div>
                <div>
                  <p className="text-xs text-blue-700">Password:</p>
                  <code className="text-sm font-mono text-blue-900">{generatePassword() || "Enter name and select branch"}</code>
                </div>
              </div>
            </div>
          )}

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
              "Add teacher"
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Add Teacher" : "Save Changes"}</DialogTitle>
            <DialogDescription>
              {mode === "add"
                ? `Are you sure you want to add ${name}?`
                : `Are you sure you want to update ${name}'s profile?`}
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
                "Add Teacher"
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
