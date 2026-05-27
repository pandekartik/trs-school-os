import { createAdminClient } from "@/lib/supabase-admin";
import type { UserRole } from "@/lib/role-access";

export async function getRoleByUserId(userId: string): Promise<UserRole | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("teacher")
      .select("role")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[getRoleByUserId] Query error:", error);
      return null;
    }

    if (!data) {
      console.warn("[getRoleByUserId] No teacher found for user:", userId);
      return null;
    }

    const role = data.role as UserRole;
    console.log("[getRoleByUserId] Found role:", role, "for user:", userId);
    return role;
  } catch (err) {
    console.error("[getRoleByUserId] Unexpected error:", err);
    return null;
  }
}
