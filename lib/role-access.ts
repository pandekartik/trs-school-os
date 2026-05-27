export type UserRole = "super_admin" | "admin" | "coordinator" | "teacher";

export const routeAccess: Record<string, UserRole[]> = {
  "/admin/users": ["super_admin"],
  "/admin/activity": ["super_admin"],
  "/admin": ["super_admin", "admin"],
  "/setup": ["super_admin", "admin"],
  "/timetable": ["super_admin", "admin"],
  "/content": ["super_admin", "admin", "coordinator"],
  "/teacher": ["super_admin", "admin", "coordinator", "teacher"],
};

export function getLandingRoute(role: UserRole | null) {
  if (role === "super_admin") return "/admin";
  if (role === "admin") return "/admin";
  if (role === "coordinator") return "/content";
  return "/teacher";
}
