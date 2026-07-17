import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import type { UserRole } from "@/lib/role-access";
import type { Branch } from "@/lib/types";
export type { UserRole } from "@/lib/role-access";
export { routeAccess, getLandingRoute } from "@/lib/role-access";

export const ACTIVE_BRANCH_COOKIE = "active_branch_id";

export async function getSession() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getTeacherProfile() {
  const user = await getUser();
  if (!user) {
    console.warn("[getTeacherProfile] No user found");
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("teacher")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getTeacherProfile] Query error:", error);
    return null;
  }

  if (!data) {
    console.warn("[getTeacherProfile] No teacher record found for user:", user.id);
    return null;
  }

  return data;
}

export async function getRole(): Promise<UserRole | null> {
  const profile = await getTeacherProfile();
  return (profile?.role as UserRole) ?? null;
}

/**
 * Resolves the branch the current user is operating in.
 * teacher/coordinator are pinned to their own teacher.branch_id (no
 * switching). super_admin/admin can switch via the active_branch_id
 * cookie, set through /api/set-branch; absent a valid cookie they fall
 * back to their own branch, then the first active branch.
 */
export async function getActiveBranch(): Promise<Branch | null> {
  const profile = await getTeacherProfile();
  if (!profile) return null;

  const admin = createAdminClient();

  if (profile.role === "teacher" || profile.role === "coordinator") {
    if (!profile.branch_id) return null;
    const { data } = await admin.from("branch").select("*").eq("id", profile.branch_id).maybeSingle();
    return (data as Branch) ?? null;
  }

  const cookieStore = await cookies();
  const cookieBranchId = cookieStore.get(ACTIVE_BRANCH_COOKIE)?.value;

  if (cookieBranchId) {
    const { data } = await admin
      .from("branch")
      .select("*")
      .eq("id", cookieBranchId)
      .eq("is_active", true)
      .maybeSingle();
    if (data) return data as Branch;
  }

  if (profile.branch_id) {
    const { data } = await admin.from("branch").select("*").eq("id", profile.branch_id).maybeSingle();
    if (data) return data as Branch;
  }

  const { data } = await admin
    .from("branch")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data as Branch) ?? null;
}

