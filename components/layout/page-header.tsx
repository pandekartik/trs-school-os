"use client";

import { usePathname } from "next/navigation";

const routeLabels: Record<string, string> = {
  "/admin":    "Admin Dashboard",
  "/setup":    "Academic Setup",
  "/content":  "Content",
  "/timetable":"Timetable",
  "/teacher":  "Teacher View",
};

export function PageHeader() {
  const pathname = usePathname();
  const label = routeLabels[pathname] ?? "TRS School OS";

  return (
    <span
      className="text-sm font-medium"
      style={{ fontFamily: "var(--font-kumbh), sans-serif" }}
    >
      {label}
    </span>
  );
}