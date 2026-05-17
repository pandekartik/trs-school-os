import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { getRole } from "@/lib/auth";
import { UserManagement } from "@/components/admin/user-management";

export default async function AdminUsersPage() {
  const role = await getRole();
  if (role !== "admin") redirect("/admin");

  const db = await createServerClient();
  const { data: users } = await db
    .from("teacher")
    .select("id, name, email, role, is_active, created_at, auth_user_id")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Invite-only user management for TRS internal staff.
        </p>
      </div>

      <UserManagement users={users ?? []} />
    </div>
  );
}
