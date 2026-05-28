import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { getRole } from "@/lib/auth";
import { UsersShell } from "@/components/admin/users-shell";

export default async function AdminUsersPage() {
  const role = await getRole();
  if (role !== "super_admin") redirect("/admin");

  const adminDb = createAdminClient();

  const { data: teachers } = await adminDb
    .from("teacher")
    .select("id, name, email, phone, role, is_active, auth_user_id, created_at")
    .order("created_at", { ascending: false });

  const { data: authUsers } = await adminDb.auth.admin.listUsers();

  const mergedTeachers = (teachers ?? []).map((teacher) => {
    const authUser = authUsers?.users.find((u) => u.id === teacher.auth_user_id);
    return {
      ...teacher,
      last_sign_in_at: authUser?.last_sign_in_at,
      email_confirmed_at: authUser?.email_confirmed_at,
    };
  });

  return <UsersShell teachers={mergedTeachers} />;
}
