import { createAdminClient } from "@/lib/supabase-admin";
import type { UserRole } from "@/lib/role-access";

export async function getRoleByUserId(userId: string): Promise<UserRole | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("teacher")
    .select("role")
    .eq("auth_user_id", userId)
    .maybeSingle();

  return (data?.role as UserRole) ?? null;
}
