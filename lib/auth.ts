import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import type { UserRole } from "@/lib/role-access";
export type { UserRole } from "@/lib/role-access";
export { routeAccess, getLandingRoute } from "@/lib/role-access";

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

