"use client";

import { useMemo, useState, type FormEvent } from "react";
import { createUserAccount } from "@/app/(dashboard)/admin/users/actions";
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
import { Copy, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "coordinator" | "teacher" | string;
  is_active: boolean;
  created_at: string;
};

type Props = {
  users: UserRow[];
};

const roleMeta: Record<string, { label: string; border: string; bg: string; color: string }> = {
  admin: { label: "Admin", border: "#f0b0b7", bg: "#fce8ea", color: "#a01b2b" },
  coordinator: { label: "Coordinator", border: "#b5d4f4", bg: "#e6f1fb", color: "#185FA5" },
  teacher: { label: "Teacher", border: "#c0dd97", bg: "#eaf3de", color: "#3B6D11" },
};

export function UserManagement({ users }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "coordinator" | "teacher">("teacher");
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [lastCreatedEmail, setLastCreatedEmail] = useState("");

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.name.localeCompare(b.name)),
    [users]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setGeneratedPassword("");
    setLastCreatedEmail("");

    const result = await createUserAccount(new FormData(event.currentTarget));
    setLoading(false);

    if ("error" in result) {
      toast.error("Create user failed", { description: result.error });
      return;
    }

    setGeneratedPassword(result.password);
    setLastCreatedEmail(email);
    setName("");
    setEmail("");
    setRole("teacher");
    event.currentTarget.reset();
    toast.success("User created");
  }

  async function copyPassword() {
    if (!generatedPassword) return;
    await navigator.clipboard.writeText(generatedPassword);
    toast.success("Password copied");
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

          {generatedPassword && (
            <div className="mt-4 rounded-xl border bg-[#fce8ea]/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Generated password
                  </p>
                  <p className="mt-1 font-mono text-sm break-all">{generatedPassword}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={copyPassword}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Share this securely with {lastCreatedEmail || "the new user"}.
              </p>
            </div>
          )}
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
                  <Badge variant={user.is_active ? "default" : "secondary"} className="shrink-0">
                    {user.is_active ? "Active" : "Disabled"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
