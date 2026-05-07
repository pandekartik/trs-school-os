import { auth, currentUser } from "@clerk/nextjs/server";

export type UserRole = "admin" | "coordinator" | "teacher";

export async function getRole(): Promise<UserRole | null> {
  const { sessionClaims } = await auth();
  const metadata = sessionClaims?.metadata as { role?: UserRole } | undefined;
  return metadata?.role ?? null;
}

export async function requireRole(allowed: UserRole[]) {
  const role = await getRole();
  if (!role || !allowed.includes(role)) {
    return false;
  }
  return true;
}

// Route access map — which roles can access which routes
export const routeAccess: Record<string, UserRole[]> = {
  "/admin":     ["admin", "coordinator"],
  "/setup":     ["admin"],
  "/content":   ["admin"],
  "/timetable": ["admin", "coordinator"],
  "/teacher":   ["admin", "coordinator", "teacher"],
};