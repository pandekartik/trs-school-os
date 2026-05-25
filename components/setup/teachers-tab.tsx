"use client";

import { useState } from "react";
import { Teacher } from "@/lib/types";
import { createTeacher, updateTeacher, deleteTeacher } from "@/lib/actions/setup";
import type { UserRole } from "@/lib/role-access";
import { useAction } from "@/lib/hooks/use-action";
import { EditableRow } from "@/components/shared/editable-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Users } from "lucide-react";
import { toast } from "sonner";

const roleMeta: Record<UserRole, { color: string; border: string; bg: string; avatar: string }> = {
  admin:       { color: "#ba2032", border: "#f0b0b7", bg: "#fce8ea", avatar: "#fce8ea" },
  coordinator: { color: "#185FA5", border: "#b5d4f4", bg: "#e6f1fb", avatar: "#e6f1fb" },
  teacher:     { color: "#16803c", border: "#bbf7d0", bg: "#f0fdf4", avatar: "#f0fdf4" },
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function EditTeacherForm({ t }: { t: Teacher }) {
  const [role, setRole] = useState<UserRole>(t.role);
  const action = useAction((fd) => updateTeacher(t.id, fd), {
    successMessage: "Teacher updated",
  });
  return (
    <form onSubmit={action.handleSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="role" value={role} />
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1.5">
          <Label>Name</Label>
          <Input name="name" defaultValue={t.name} className="h-8 rounded-md border-[#D4D4D4] text-xs" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Phone</Label>
          <Input name="phone" defaultValue={t.phone ?? ""} className="h-8 rounded-md border-[#D4D4D4] text-xs" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={(value) => setRole(value as typeof role)}>
            <SelectTrigger className="h-8 rounded-md border-[#D4D4D4] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="coordinator">Coordinator</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" size="sm" className="h-8 w-fit rounded-md bg-[#ba2032] text-xs text-white hover:bg-[#ba2032]" disabled={action.loading}>
        {action.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
      </Button>
    </form>
  );
}

export function TeachersTab({ teachers }: { teachers: Teacher[] }) {
  const [role, setRole] = useState("teacher");
  const teacherAction = useAction(createTeacher, { successMessage: "Teacher added" });

  async function handleDelete(id: string) {
    const r = await deleteTeacher(id);
    if (r?.error) toast.error("Delete failed", { description: r.error });
    else toast.success("Deleted");
  }

  return (
    <div className="min-h-full bg-[#FAFAFA]">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#171717]">Teachers</h1>
        <p className="mt-1 text-sm text-[#737373]">Manage teaching staff and their roles.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="gap-0 rounded-lg border-[#E5E5E5] bg-white py-0 shadow-none">
          <CardHeader className="border-b border-[#E5E5E5] px-4 py-3">
            <CardTitle className="text-sm font-semibold text-[#171717]">Add teacher</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={teacherAction.handleSubmit} className="flex flex-col gap-3">
              <input type="hidden" name="role" value={role} />
              <div className="flex flex-col gap-1.5">
                <Label>Full name</Label>
                <Input name="name" placeholder="e.g. Ms. Sharma" className="h-8 rounded-md border-[#D4D4D4]" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Email</Label>
                <Input name="email" type="email" placeholder="teacher@trs.edu" className="h-8 rounded-md border-[#D4D4D4]" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Phone</Label>
                <Input name="phone" placeholder="+91 98765 43210" className="h-8 rounded-md border-[#D4D4D4]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as typeof role)}>
                  <SelectTrigger className="h-8 rounded-md border-[#D4D4D4]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="coordinator">Coordinator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={teacherAction.loading} className="h-8 w-full rounded-md bg-[#ba2032] text-white hover:bg-[#ba2032]">
                {teacherAction.loading
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Adding...</>
                  : <><Plus className="h-3.5 w-3.5" />Add teacher</>
                }
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="gap-0 rounded-lg border-[#E5E5E5] bg-white py-0 shadow-none">
          <CardHeader className="border-b border-[#E5E5E5] px-4 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#171717]">All teachers</CardTitle>
              <Badge variant="outline" className="h-5 rounded px-2 text-[11px] font-medium">{teachers.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {teachers.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center text-xs text-[#737373]">
                <Users className="mb-2 h-8 w-8 text-[#A3A3A3]" />
                <p>No teachers added yet</p>
              </div>
            ) : (
              <div>
                {teachers.map((t) => {
                  const meta = roleMeta[t.role];
                  return (
                    <EditableRow
                      key={t.id}
                      editForm={<EditTeacherForm t={t} />}
                      onDelete={() => handleDelete(t.id)}
                      className="min-h-11 rounded-none border-x-0 border-t-0 border-b border-[#F5F5F5] bg-white px-4 py-2 hover:bg-[#FAFAFA]"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                          style={{ color: meta.color, background: meta.avatar }}
                        >
                          {initials(t.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-[#171717]">{t.name}</div>
                          <div className="truncate text-xs text-[#737373]">{t.email}</div>
                        </div>
                        <Badge
                          className="h-5 rounded border px-2 text-[11px] font-medium capitalize"
                          style={{ color: meta.color, borderColor: meta.border, background: meta.bg }}
                        >
                          {t.role}
                        </Badge>
                      </div>
                    </EditableRow>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
