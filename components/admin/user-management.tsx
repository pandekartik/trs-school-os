"use client";

import { useMemo, useState, type FormEvent } from "react";
import { createUserAccount, deleteUserAccount } from "@/app/(dashboard)/admin/users/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "coordinator" | "teacher" | string;
  is_active: boolean;
  created_at: string;
  auth_user_id: string | null;
};

type Props = {
  users: UserRow[];
};

const roleMeta: Record<string, { label: string; border: string; bg: string; color: string }> = {
  super_admin: { label: "Super Admin", border: "#f0b0b7", bg: "#fce8ea", color: "#a01b2b" },
  admin: { label: "Admin", border: "#f0b0b7", bg: "#fce8ea", color: "#a01b2b" },
  coordinator: { label: "Coordinator", border: "#b5d4f4", bg: "#e6f1fb", color: "#185FA5" },
  teacher: { label: "Teacher", border: "#c0dd97", bg: "#eaf3de", color: "#3B6D11" },
};

export function UserManagement({ users }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "coordinator" | "teacher">("teacher");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.name.localeCompare(b.name)),
    [users]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setLoading(true);

    const result = await createUserAccount(new FormData(form));
    setLoading(false);

    if ("error" in result) {
      toast.error("Create user failed", { description: result.error });
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
    setRole("teacher");
    form.reset();
    toast.success("User created");
  }

  async function handleDelete(user: UserRow) {
    if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    if (!user.auth_user_id) {
      toast.error("Cannot delete: missing auth ID");
      return;
    }
    setDeletingId(user.id);
    const result = await deleteUserAccount(user.id, user.auth_user_id);
    setDeletingId(null);
    if ("error" in result) {
      toast.error("Delete failed", { description: result.error });
    } else {
      toast.success(`${user.name} deleted`);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Create user</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input type="hidden" name="role" value={role} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ms. Sharma"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@trs.edu"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set a temporary password"
                required
                minLength={8}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as typeof role)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="coordinator">Coordinator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Creating...</> : <><Plus className="h-3.5 w-3.5" />Create user</>}
            </Button>
          </form>

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users</CardTitle>
            <Badge variant="outline" className="font-normal">
              {users.length} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {sortedUsers.map((user) => {
              const meta = roleMeta[user.role] ?? roleMeta.teacher;
              return (
                <div key={user.id} className="flex items-center justify-between gap-3 rounded-lg border bg-secondary/30 px-3 py-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{user.name}</span>
                      <Badge
                        className="text-[10px] h-5 px-2 font-normal border"
                        style={{ color: meta.color, borderColor: meta.border, background: meta.bg }}
                      >
                        {meta.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Active" : "Disabled"}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      disabled={deletingId === user.id}
                      onClick={() => handleDelete(user)}
                    >
                      {deletingId === user.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
