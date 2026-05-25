export type UserRole = "admin" | "coordinator" | "teacher";

export const routeAccess: Record<string, UserRole[]> = {
  "/admin/users": ["admin"],
  "/admin": ["admin", "coordinator"],
  "/setup": ["admin"],
  "/timetable": ["admin"],
  "/content": ["admin", "coordinator"],
  "/teacher": ["admin", "coordinator", "teacher"],
};

export function getLandingRoute(role: UserRole | null) {
  if (role === "admin") return "/admin";
  if (role === "coordinator") return "/content";
  return "/teacher";
}
