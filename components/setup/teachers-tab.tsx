"use client";

import { useState } from "react";
import { Teacher } from "@/lib/types";
import { createTeacher, updateTeacher, deleteTeacher } from "@/lib/actions/setup";
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
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

const roleMeta: Record<string, { color: string; border: string; bg: string }> = {
  admin:       { color: "#a01b2b", border: "#f0b0b7", bg: "#fce8ea" },
  hod:         { color: "#534AB7", border: "#afa9ec", bg: "#eeedfe" },
  coordinator: { color: "#185FA5", border: "#b5d4f4", bg: "#e6f1fb" },
  teacher:     { color: "#3B6D11", border: "#c0dd97", bg: "#eaf3de" },
};

function EditTeacherForm({ t }: { t: Teacher }) {
  const [role, setRole] = useState(t.role);
  const action = useAction((fd) => updateTeacher(t.id, fd), {
    successMessage: "Teacher updated",
  });
  return (
    <form ref={action.formRef} action={action.execute} className="flex flex-col gap-2">
      <input type="hidden" name="role" value={role} />
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <Label>Name</Label>
          <Input name="name" defaultValue={t.name} className="h-7 text-xs" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Phone</Label>
          <Input name="phone" defaultValue={t.phone ?? ""} className="h-7 text-xs" />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="hod">HOD</SelectItem>
              <SelectItem value="coordinator">Coordinator</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" size="sm" className="h-7 text-xs w-fit" disabled={action.loading}>
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
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle>Add teacher</CardTitle></CardHeader>
        <CardContent>
          <form ref={teacherAction.formRef} action={teacherAction.execute} className="flex flex-col gap-3">
            <input type="hidden" name="role" value={role} />
            <div className="flex flex-col gap-1.5">
              <Label>Full name</Label>
              <Input name="name" placeholder="e.g. Ms. Sharma" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <Input name="email" type="email" placeholder="teacher@trs.edu" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Phone</Label>
              <Input name="phone" placeholder="+91 98765 43210" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="hod">HOD</SelectItem>
                  <SelectItem value="coordinator">Coordinator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={teacherAction.loading} className="w-full">
              {teacherAction.loading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Adding...</>
                : <><Plus className="h-3.5 w-3.5" />Add teacher</>
              }
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All teachers</CardTitle>
            <Badge variant="outline" className="font-normal">{teachers.length} people</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {teachers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No teachers yet.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {teachers.map((t) => {
                const meta = roleMeta[t.role];
                return (
                  <EditableRow
                    key={t.id}
                    editForm={<EditTeacherForm t={t} />}
                    onDelete={() => handleDelete(t.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{t.name}</span>
                      <Badge
                        className="text-[10px] h-5 px-2 font-normal border"
                        style={{ color: meta.color, borderColor: meta.border, background: meta.bg }}
                      >
                        {t.role}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{t.email}</div>
                  </EditableRow>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}