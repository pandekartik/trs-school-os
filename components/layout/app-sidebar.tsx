"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { CSSProperties, ElementType } from "react";
import { createClient } from "@/lib/supabase";
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
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  BookOpen,
  Building2,
  CalendarCheck,
  CalendarDays,
  CalendarOff,
  CalendarRange,
  Clock,
  ClipboardCheck,
  FileText,
  GitBranch,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LogOut,
  Upload,
  UserCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/role-access";
import { ActivitySquare } from "lucide-react";

type NavItem = {
  title: string;
  href: string;
  icon: ElementType;
  roles: UserRole[];
  shortcut?: string;
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "ADMIN",
    items: [
      { title: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["super_admin", "admin"] },
      { title: "Branches", href: "/admin/branches", icon: GitBranch, roles: ["super_admin"] },
      { title: "Users", href: "/admin/users", icon: Users, roles: ["super_admin"] },
      { title: "Activity", href: "/admin/activity", icon: ActivitySquare, roles: ["super_admin"] },
    ],
  },
  {
    label: "SETUP",
    items: [
      { title: "School Year", href: "/setup/school-year", icon: CalendarRange, roles: ["super_admin", "admin"] },
      { title: "Standards", href: "/setup/standards", icon: Building2, roles: ["super_admin", "admin"] },
      { title: "Segments", href: "/setup/segments", icon: Layers, roles: ["super_admin", "admin"] },
      { title: "Subjects", href: "/setup/subjects", icon: BookOpen, roles: ["super_admin", "admin"] },
      { title: "Teachers", href: "/setup/teachers", icon: GraduationCap, roles: ["super_admin", "admin"] },
      { title: "Chapters", href: "/setup/chapters", icon: FileText, roles: ["super_admin", "admin"] },
      { title: "Teacher Allocation", href: "/setup/teacher-allocation", icon: UserCheck, roles: ["super_admin", "admin"] },
    ],
  },
  {
    label: "TIMETABLE",
    items: [
      { title: "Timetable", href: "/timetable", icon: CalendarDays, roles: ["super_admin", "admin"] },
      { title: "Time Templates", href: "/timetable/templates", icon: Clock, roles: ["super_admin", "admin"] },
      { title: "Holidays", href: "/timetable/holidays", icon: CalendarOff, roles: ["super_admin", "admin"] },
    ],
  },
  {
    label: "CONTENT",
    items: [
      { title: "Content", href: "/content", icon: Upload, roles: ["super_admin", "admin", "coordinator"] },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { title: "Teacher View", href: "/teacher", icon: CalendarCheck, roles: ["super_admin", "admin", "coordinator", "teacher"] },
      { title: "Attendance", href: "/teacher/attendance", icon: ClipboardCheck, roles: ["super_admin", "admin", "teacher"] },
    ],
  },
];

const sidebarStyle = {
  "--sidebar-background": "var(--sidebar-bg)",
  "--sidebar-foreground": "var(--sidebar-text)",
  "--sidebar-primary": "var(--sidebar-active-bg)",
  "--sidebar-primary-foreground": "var(--sidebar-active-text)",
  "--sidebar-accent": "var(--sidebar-bg-hover)",
  "--sidebar-accent-foreground": "var(--sidebar-text-active)",
  "--sidebar-border": "var(--sidebar-border)",
  "--sidebar-ring": "var(--brand)",
} as CSSProperties;

const roleTone: Record<UserRole, string> = {
  super_admin: "bg-brand",
  admin: "bg-brand",
  coordinator: "bg-info",
  teacher: "bg-success",
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function isActivePath(pathname: string, href: string) {
  // Exact match first
  if (pathname === href) return true;

  // For /admin, don't match children
  if (href === "/admin") return false;

  // For /timetable, don't match children (templates, holidays, builder are separate)
  if (href === "/timetable") return false;

  // For /teacher, don't match children (attendance is a separate page)
  if (href === "/teacher") return false;

  // For other paths, match children
  return pathname.startsWith(href + "/");
}

interface AppSidebarProps {
  role: UserRole | null;
  teacherName: string;
}

export function AppSidebar({ role, teacherName }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const displayRole = role ?? "teacher";

  async function handleSignOut() {
    const supabase = createClient();

    await fetch("/api/audit/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "user.signed_out" }),
    }).catch(() => {
      // Silently fail if audit logging fails
    });

    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <TooltipProvider>
      <Sidebar collapsible="icon" style={sidebarStyle} className="border-r border-sidebar-border">
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-3 py-0 group-data-[collapsible=icon]:px-0">
        <Image
          src="/logo.png"
          alt="The Rosary School"
          width={140}
          height={36}
          style={{ height: "36px", width: "auto", objectFit: "contain" }}
        />
      </SidebarHeader>

      <SidebarContent className="gap-1 px-2 py-3">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => role && item.roles.includes(role)
          );
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label} className="mb-2 p-0 group-data-[collapsible=icon]:mb-1">
              <SidebarGroupLabel className="h-auto px-2 pb-1.5 pt-2.5 group-data-[collapsible=icon]:hidden">
                {group.label}
              </SidebarGroupLabel>
              <SidebarMenu className="gap-0.5">
                {visibleItems.map((item) => {
                  const isActive = isActivePath(pathname, item.href);
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={cn(
                          "h-8 gap-2.5 px-2 text-[13px] font-medium transition-colors group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0",
                          isActive
                            ? "bg-brand text-white hover:bg-brand hover:text-white [&_svg]:text-white"
                            : "text-text-secondary hover:bg-surface-2 hover:text-foreground [&_svg]:text-text-muted hover:[&_svg]:text-text-secondary"
                        )}
                      >
                        <Link href={item.href}>
                          <Icon className="size-[15px]" />
                          <span className="truncate group-data-[collapsible=icon]:hidden">
                            {item.title}
                          </span>
                          {item.shortcut && (
                            <span
                              className={cn(
                                "ml-auto rounded-[3px] border px-1.5 py-px font-mono text-[10px] group-data-[collapsible=icon]:hidden",
                                isActive
                                  ? "border-white/30 bg-white/10 text-white/95"
                                  : "border-border bg-surface text-text-muted"
                              )}
                            >
                              {item.shortcut}
                            </span>
                          )}
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

      <div className="flex items-center gap-2 px-4 pb-2 pt-2 font-mono text-[10px] tracking-[0.04em] text-text-muted group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-brand shadow-[0_0_6px_rgba(186,32,50,0.4)]" />
        <span className="group-data-[collapsible=icon]:hidden">LIVE · SCHOOL OPS</span>
      </div>

      <SidebarFooter className="h-[60px] justify-center border-t border-sidebar-border p-0">
        <div className="flex w-full items-center gap-2.5 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tracking-[0.02em] text-white", roleTone[displayRole])}>
            {getInitials(teacherName)}
          </div>
          <div className="min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
            <div className="truncate text-[13px] font-medium text-foreground">{teacherName}</div>
            <div className="truncate text-[11px] capitalize text-text-muted">{displayRole}</div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7 text-text-muted hover:bg-surface-2 hover:text-foreground group-data-[collapsible=icon]:hidden"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut className="size-[15px]" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
