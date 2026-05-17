export type UserRole = "admin" | "coordinator" | "teacher";

export const routeAccess: Record<string, UserRole[]> = {
  "/admin": ["admin", "coordinator"],
  "/setup": ["admin"],
  "/content": ["admin", "coordinator"],
  "/timetable": ["admin"],
  "/teacher": ["admin", "coordinator", "teacher"],
};

export function getLandingRoute(role: UserRole | null) {
  if (role === "admin") return "/admin";
  if (role === "coordinator") return "/content";
  return "/teacher";
}
