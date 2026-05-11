"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Sidebar, SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Settings, BookOpen, CalendarDays,
  GraduationCap, LayoutDashboard, LogOut, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type UserRole = "admin" | "coordinator" | "teacher";

type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { title: "Admin Dashboard", href: "/admin",    icon: LayoutDashboard, roles: ["admin", "coordinator"] },
      { title: "Users", href: "/admin/users", icon: Users, roles: ["admin"] },
    ],
  },
  {
    label: "Setup",
    items: [
      { title: "Academic Setup", href: "/setup",   icon: Settings,  roles: ["admin"] },
      { title: "Content",        href: "/content", icon: BookOpen,  roles: ["admin"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Timetable",    href: "/timetable", icon: CalendarDays,   roles: ["admin", "coordinator"] },
      { title: "Teacher View", href: "/teacher",   icon: GraduationCap,  roles: ["admin", "coordinator", "teacher"] },
    ],
  },
];

const sidebarStyle = {
  "--sidebar-background":         "#1c0509",
  "--sidebar-foreground":         "#f0dede",
  "--sidebar-primary":            "#ba2032",
  "--sidebar-primary-foreground": "#ffffff",
  "--sidebar-accent":             "rgba(186,32,50,0.25)",
  "--sidebar-accent-foreground":  "#f0dede",
  "--sidebar-border":             "rgba(255,255,255,0.07)",
} as React.CSSProperties;

interface AppSidebarProps {
  role: string | null;
  teacherName: string;
}

export function AppSidebar({ role, teacherName }: AppSidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <Sidebar style={sidebarStyle}>
      <SidebarHeader className="px-4 py-4">
        <Image
          src="/logo.png"
          alt="The Rosary School"
          width={140}
          height={36}
          style={{ height: "36px", width: "auto", objectFit: "contain" }}
        />
      </SidebarHeader>

      <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "0 8px" }} />

      <SidebarContent className="px-2 py-3">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => role && item.roles.includes(role as UserRole)
          );
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label} className="mb-2 p-0">
              <SidebarGroupLabel
                style={{
                  fontSize: "10px", fontWeight: 600,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  color: "rgba(240,222,222,0.4)", padding: "0 12px", marginBottom: "4px",
                }}
              >
                {group.label}
              </SidebarGroupLabel>
              <SidebarMenu>
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        style={{
                          borderRadius: "8px", height: "36px",
                          padding: "0 12px", fontSize: "13px",
                          fontWeight: isActive ? 500 : 400,
                          color: isActive ? "#ffffff" : "rgba(240,222,222,0.7)",
                          background: isActive ? "#ba2032" : "transparent",
                        }}
                      >
                        <Link href={item.href}>
                          <item.icon style={{ width: "15px", height: "15px", opacity: isActive ? 1 : 0.7 }} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "0 8px" }} />

      <SidebarFooter className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <span style={{ fontSize: "12px", fontWeight: 500, color: "rgba(240,222,222,0.9)" }}>
              {teacherName}
            </span>
            {role && (
              <span style={{ fontSize: "10px", color: "rgba(240,222,222,0.75)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Role: {role}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-8 px-2 text-xs"
            style={{ color: "rgba(240,222,222,0.5)" }}
            onClick={handleSignOut}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
