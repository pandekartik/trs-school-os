import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export type UserRole = "admin" | "coordinator" | "teacher";

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
  if (!user) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("teacher")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  return data;
}

export async function getRole(): Promise<UserRole | null> {
  const profile = await getTeacherProfile();
  return (profile?.role as UserRole) ?? null;
}

export const routeAccess: Record<string, UserRole[]> = {
  "/admin/users": ["admin"],
  "/admin":     ["admin", "coordinator"],
  "/setup":     ["admin"],
  "/content":   ["admin"],
  "/timetable": ["admin", "coordinator"],
  "/teacher":   ["admin", "coordinator", "teacher"],
};
