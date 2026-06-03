"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Key, Pencil, Users } from "lucide-react";
import { toast } from "sonner";
import { UserPanel } from "./user-panel";
import { cn } from "@/lib/utils";

export type Teacher = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "super_admin" | "admin" | "coordinator" | "teacher";
  is_active: boolean;
  auth_user_id: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
};

const roleBadgeColor: Record<string, string> = {
  super_admin: "bg-brand",
  admin: "bg-blue-500",
  coordinator: "bg-purple-500",
  teacher: "bg-green-500",
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type Props = {
  teachers: Teacher[];
};

export function UsersShell({ teachers }: Props) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"add" | "edit" | "password">("add");
  const [selectedUser, setSelectedUser] = useState<Teacher | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleAddUser() {
    setSelectedUser(null);
    setPanelMode("add");
    setPanelOpen(true);
  }

  function handleEditUser(user: Teacher) {
    setSelectedUser(user);
    setPanelMode("edit");
    setPanelOpen(true);
  }

  function handleChangePassword(user: Teacher) {
    setSelectedUser(user);
    setPanelMode("password");
    setPanelOpen(true);
  }

  function handleClose() {
    setPanelOpen(false);
    setSelectedUser(null);
    setPanelMode("add");
  }

  async function handleConfirmDelete() {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      if (userToDelete.auth_user_id) {
        await fetch("/api/admin/set-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth_user_id: userToDelete.auth_user_id,
            action: "disable",
          }),
        });
      }

      const updateRes = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userToDelete.id,
          is_active: false,
        }),
      });

      if (updateRes.ok) {
        toast.success(`${userToDelete.name} deactivated`);
        setDeleteDialogOpen(false);
        setUserToDelete(null);
        window.location.reload();
      } else {
        toast.error("Failed to deactivate user");
      }
    } catch (err) {
      toast.error("Error deactivating user");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Users <span className="text-base font-normal text-muted-foreground">({teachers.length})</span></h1>
            <p className="text-sm text-muted-foreground mt-1">Manage user accounts and access.</p>
          </div>
          <Button onClick={handleAddUser} className="gap-2">
            <Plus className="size-4" />
            Add user
          </Button>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          {teachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Users className="size-10 text-muted-foreground" />
              <div>
                <p className="font-medium">No users yet</p>
                <p className="text-sm text-muted-foreground">Add your first user</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead>USER</TableHead>
                    <TableHead>ROLE</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead>AUTH</TableHead>
                    <TableHead>CREATED</TableHead>
                    <TableHead className="w-20">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn("flex size-8 items-center justify-center rounded-full text-xs font-semibold text-white", roleBadgeColor[teacher.role] || "bg-slate-400")}>
                            {getInitials(teacher.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{teacher.name}</p>
                            <p className="text-xs text-muted-foreground">{teacher.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {teacher.role.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={teacher.is_active ? "default" : "secondary"} className="text-xs font-normal">
                          {teacher.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {teacher.auth_user_id ? (
                          <div>
                            <Badge variant="secondary" className="text-xs font-normal">Linked</Badge>
                            {teacher.last_sign_in_at && (
                              <p className="text-xs text-muted-foreground mt-1">{formatDate(teacher.last_sign_in_at)}</p>
                            )}
                          </div>
                        ) : (
                          <Badge variant="secondary" className="text-xs font-normal">Unlinked</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(teacher.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0"
                            onClick={() => handleEditUser(teacher)}
                            title="Edit user"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          {teacher.auth_user_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-8 p-0"
                              onClick={() => handleChangePassword(teacher)}
                              title="Change password"
                            >
                              <Key className="size-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              setUserToDelete(teacher);
                              setDeleteDialogOpen(true);
                            }}
                            title="Deactivate user"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {panelOpen && (
        <UserPanel
          mode={panelMode}
          user={selectedUser}
          onClose={handleClose}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate User</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate <span className="font-medium text-foreground">{userToDelete?.name}</span>? The user will lose access to the system but their data will be preserved.
            </DialogDescription>
          </DialogHeader>
          {userToDelete?.auth_user_id && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mx-6">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> If linked to authentication, login access will also be disabled.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? <><Loader2 className="size-4 animate-spin" />Deactivating...</> : "Deactivate User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
