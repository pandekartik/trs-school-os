export type UserRole = "admin" | "coordinator" | "teacher";

export const routeAccess: Record<string, UserRole[]> = {
  "/admin/users": ["admin"],
  "/admin": ["admin", "coordinator"],
  "/setup": ["admin"],
  "/content": ["admin"],
  "/timetable": ["admin", "coordinator"],
  "/teacher": ["admin", "coordinator", "teacher"],
};
