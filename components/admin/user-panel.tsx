"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
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
import type { Teacher } from "./users-shell";

type Props = {
  mode: "add" | "edit" | "password";
  user: Teacher | null;
  onClose: () => void;
};

export function UserPanel({ mode, user, onClose }: Props) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [role, setRole] = useState<"super_admin" | "admin" | "coordinator" | "teacher">(user?.role || "teacher");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"add" | "edit" | "password" | null>(null);

  function validateAddUser(): boolean {
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }
    return true;
  }

  async function executeAddUser() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/invite-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          role,
          password,
        }),
      });

      if (response.ok) {
        toast.success("User added successfully");
        onClose();
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add user");
      }
    } catch (err) {
      toast.error("Error adding user");
    } finally {
      setLoading(false);
    }
  }

  function handleAddUser() {
    if (!validateAddUser()) return;
    setConfirmDialogOpen(true);
    setPendingAction("add");
  }

  function validateEditUser(): boolean {
    if (!name) {
      toast.error("Please enter a name");
      return false;
    }
    return true;
  }

  async function executeEditUser() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user?.id,
          name,
          phone,
          role,
          is_active: isActive,
        }),
      });

      if (response.ok) {
        toast.success("User updated successfully");
        onClose();
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update user");
      }
    } catch (err) {
      toast.error("Error updating user");
    } finally {
      setLoading(false);
    }
  }

  function handleEditUser() {
    if (!validateEditUser()) return;
    setConfirmDialogOpen(true);
    setPendingAction("edit");
  }

  function validateChangePassword(): boolean {
    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }
    return true;
  }

  async function executeChangePassword() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_user_id: user?.auth_user_id,
          new_password: password,
        }),
      });

      if (response.ok) {
        toast.success("Password updated successfully");
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update password");
      }
    } catch (err) {
      toast.error("Error updating password");
    } finally {
      setLoading(false);
    }
  }

  function handleChangePassword() {
    if (!validateChangePassword()) return;
    setConfirmDialogOpen(true);
    setPendingAction("password");
  }

  async function handleConfirmAction() {
    if (pendingAction === "add") {
      await executeAddUser();
    } else if (pendingAction === "edit") {
      await executeEditUser();
    } else if (pendingAction === "password") {
      await executeChangePassword();
    }
    setConfirmDialogOpen(false);
    setPendingAction(null);
  }

  function getConfirmationText() {
    switch (pendingAction) {
      case "add":
        return {
          title: "Add New User",
          description: `Are you sure you want to add ${name}? They will receive login credentials and can access the system immediately.`,
        };
      case "edit":
        return {
          title: "Save Changes",
          description: `Are you sure you want to update ${name}'s profile? These changes will take effect immediately.`,
        };
      case "password":
        return {
          title: "Update Password",
          description: `Are you sure you want to change the password for ${user?.name}? This will require them to use the new password on next login.`,
        };
      default:
        return { title: "", description: "" };
    }
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
              {mode === "add" ? "Add user" : mode === "edit" ? "Edit user" : "Change Password"}
            </h2>
            {mode === "password" && (
              <p className="text-sm text-muted-foreground mt-1">Update login credentials securely.</p>
            )}
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
          {mode === "password" ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">New password</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm password</Label>
                <PasswordInput
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  required
                  className="h-11"
                />
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                )}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  Passwords must contain at least 8 characters.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
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
                    placeholder="user@example.com"
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
                  placeholder="Enter phone number (optional)"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as typeof role)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="coordinator">Coordinator</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {mode === "add" && (
                <>
                  <div className="border-t border-border pt-6 space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                      <PasswordInput
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        required
                        minLength={8}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm password</Label>
                      <PasswordInput
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        required
                        className="h-11"
                      />
                      {password && confirmPassword && password !== confirmPassword && (
                        <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                </>
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
            onClick={
              mode === "add"
                ? handleAddUser
                : mode === "edit"
                  ? handleEditUser
                  : handleChangePassword
            }
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {mode === "add" ? "Adding..." : mode === "edit" ? "Saving..." : "Updating..."}
              </>
            ) : mode === "add" ? (
              "Add user"
            ) : mode === "edit" ? (
              "Save changes"
            ) : (
              "Update password"
            )}
          </Button>
        </div>
      </div>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{getConfirmationText().title}</DialogTitle>
            <DialogDescription>
              {getConfirmationText().description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setConfirmDialogOpen(false);
                setPendingAction(null);
              }}
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
                  {pendingAction === "add" ? "Adding..." : pendingAction === "edit" ? "Saving..." : "Updating..."}
                </>
              ) : (
                pendingAction === "add" ? "Add User" : pendingAction === "edit" ? "Save Changes" : "Update Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
