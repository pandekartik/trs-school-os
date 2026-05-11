"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Settings,
  BookOpen,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
} from "lucide-react";
import { UserRole } from "@/lib/auth";

type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Admin Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        roles: ["admin", "coordinator"],
      },
    ],
  },
  {
    label: "Setup",
    items: [
      {
        title: "Academic Setup",
        href: "/setup",
        icon: Settings,
        roles: ["admin"],
      },
      {
        title: "Content",
        href: "/content",
        icon: BookOpen,
        roles: ["admin"],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Timetable",
        href: "/timetable",
        icon: CalendarDays,
        roles: ["admin", "coordinator"],
      },
      {
        title: "Teacher View",
        href: "/teacher",
        icon: GraduationCap,
        roles: ["admin", "coordinator", "teacher"],
      },
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

export function AppSidebar() {
  const pathname = usePathname();
  const { sessionClaims } = useAuth();
  const metadata = sessionClaims?.metadata as { role?: UserRole } | undefined;
  const role = metadata?.role ?? null;

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
          // Filter items by role
          const visibleItems = group.items.filter(
            (item) => role && item.roles.includes(role)
          );
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label} className="mb-2 p-0">
              <SidebarGroupLabel
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(240,222,222,0.4)",
                  padding: "0 12px",
                  marginBottom: "4px",
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
                          borderRadius: "8px",
                          height: "36px",
                          padding: "0 12px",
                          fontSize: "13px",
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
        <div className="flex flex-row gap-2 justify-start items-center text-accent">
          <UserButton showName />
          {role && (
            <span style={{
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              paddingLeft: "2px",
            }}>
              {role}
            </span>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
