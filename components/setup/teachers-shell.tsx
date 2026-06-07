"use client";

import { useState } from "react";
import type { Teacher, Branch } from "@/lib/types";
import type { UserRole } from "@/lib/role-access";
import { deleteTeacher } from "@/lib/actions/setup";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Pencil, Users } from "lucide-react";
import { toast } from "sonner";
import { TeacherPanel } from "./teacher-panel";
import { cn } from "@/lib/utils";

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

const roleBadgeColor: Record<string, string> = {
  super_admin: "bg-brand",
  admin: "bg-blue-500",
  coordinator: "bg-purple-500",
  teacher: "bg-green-500",
};

type Props = {
  teachers: Teacher[];
  role?: UserRole | null;
  activeSchoolYear?: string | null;
};

export function TeachersShell({ teachers, role, activeSchoolYear }: Props) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"add" | "edit">("add");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleAddTeacher() {
    setSelectedTeacher(null);
    setPanelMode("add");
    setPanelOpen(true);
  }

  function handleEditTeacher(teacher: Teacher) {
    setSelectedTeacher(teacher);
    setPanelMode("edit");
    setPanelOpen(true);
  }

  function handleClose() {
    setPanelOpen(false);
    setSelectedTeacher(null);
    setPanelMode("add");
  }

  async function handleConfirmDelete() {
    if (!teacherToDelete) return;

    setDeleting(true);
    try {
      const result = await deleteTeacher(teacherToDelete.id);
      if (result?.error) {
        toast.error("Delete failed", { description: result.error });
      } else {
        toast.success(`${teacherToDelete.name} deleted`);
        setDeleteDialogOpen(false);
        setTeacherToDelete(null);
        window.location.reload();
      }
    } catch (err) {
      toast.error("Error deleting teacher");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Teachers <span className="text-base font-normal text-muted-foreground">({teachers.length})</span></h1>
            <p className="text-sm text-muted-foreground mt-1">Manage teaching staff and their assignments.</p>
          </div>
          <Button onClick={handleAddTeacher} className="gap-2">
            <Plus className="size-4" />
            Add teacher
          </Button>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          {teachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Users className="size-10 text-muted-foreground" />
              <div>
                <p className="font-medium">No teachers yet</p>
                <p className="text-sm text-muted-foreground">Add your first teacher</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead>ID</TableHead>
                    <TableHead>TEACHER</TableHead>
                    <TableHead>PHONE</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead className="w-20">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.id} className="hover:bg-muted/30">
                      <TableCell>
                        <code className="text-[11px] text-muted-foreground font-mono">{teacher.display_id}</code>
                      </TableCell>
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
                      <TableCell className="text-xs text-muted-foreground">
                        {teacher.phone || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={teacher.is_active ? "default" : "secondary"} className="text-xs font-normal">
                          {teacher.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0"
                            onClick={() => handleEditTeacher(teacher)}
                            title="Edit teacher"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              setTeacherToDelete(teacher);
                              setDeleteDialogOpen(true);
                            }}
                            title="Delete teacher"
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
        <TeacherPanel
          mode={panelMode}
          teacher={selectedTeacher}
          onClose={handleClose}
          branches={branches}
          showBranchSelect={true}
          activeSchoolYear={activeSchoolYear}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Teacher</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-medium text-foreground">{teacherToDelete?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
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
              {deleting ? <><Loader2 className="size-4 animate-spin" />Deleting...</> : "Delete Teacher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
