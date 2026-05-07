"use client";

import { useState } from "react";
import { Teacher } from "@/lib/types";
import { createTeacher, deleteTeacher } from "@/lib/actions/setup";
import { useAction } from "@/lib/hooks/use-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ListItem } from "@/components/shared/list-item";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

const roleMeta: Record<string, { label: string; color: string; border: string; bg: string }> = {
  admin:       { label: "Admin",       color: "#a01b2b", border: "#f0b0b7", bg: "#fce8ea" },
  hod:         { label: "HOD",         color: "#534AB7", border: "#afa9ec", bg: "#eeedfe" },
  coordinator: { label: "Coordinator", color: "#185FA5", border: "#b5d4f4", bg: "#e6f1fb" },
  teacher:     { label: "Teacher",     color: "#3B6D11", border: "#c0dd97", bg: "#eaf3de" },
};

export function TeachersTab({ teachers }: { teachers: Teacher[] }) {
  const [role, setRole] = useState("teacher");
  const teacherAction = useAction(createTeacher, { successMessage: "Teacher added" });

  async function handleDelete(id: string) {
    const result = await deleteTeacher(id);
    if (result?.error) toast.error("Delete failed", { description: result.error });
    else toast.success("Teacher removed");
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle>Add teacher</CardTitle></CardHeader>
        <CardContent>
          <form ref={teacherAction.formRef} action={teacherAction.execute} className="flex flex-col gap-3">
            <input type="hidden" name="role" value={role} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="t-name">Full name</Label>
              <Input id="t-name" name="name" placeholder="e.g. Ms. Sharma" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="t-email">Email</Label>
              <Input id="t-email" name="email" type="email" placeholder="teacher@trs.edu" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="t-phone">Phone</Label>
              <Input id="t-phone" name="phone" placeholder="+91 98765 43210" />
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
            <p className="text-xs text-muted-foreground text-center py-6">No teachers added yet.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {teachers.map((t) => {
                const meta = roleMeta[t.role];
                return (
                  <ListItem
                    key={t.id}
                    title={t.name}
                    subtitle={t.email}
                    badges={
                      <Badge
                        className="text-[10px] h-5 px-2 font-normal border"
                        style={{
                          color: meta.color,
                          borderColor: meta.border,
                          background: meta.bg,
                        }}
                      >
                        {meta.label}
                      </Badge>
                    }
                    onDelete={() => handleDelete(t.id)}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
