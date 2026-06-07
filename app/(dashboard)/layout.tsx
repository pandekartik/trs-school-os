import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ShellTopbar } from "@/components/layout/page-header";
import { Toaster } from "@/components/ui/sonner";
import { getUser, getTeacherProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";
import type { UserRole } from "@/lib/role-access";
import type { Branch } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const profile = await getTeacherProfile();
  const role = (profile?.role as UserRole | undefined) ?? null;
  const admin = createAdminClient();
  const { data: activeSchoolYear } = await admin
    .from("school_year")
    .select("name")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch branches for super_admin branch switcher
  let branches: Branch[] = [];
  if (role === "super_admin") {
    const { data } = await admin
      .from("branch")
      .select("id, display_id, name, city, is_active, created_at, updated_at")
      .order("created_at", { ascending: false });
    branches = data ?? [];
  }

  return (
    <SidebarProvider>
      <AppSidebar role={role} teacherName={profile?.name ?? user.email ?? ""} />
      <SidebarInset className="overflow-hidden">
        <ShellTopbar role={role} schoolYearName={activeSchoolYear?.name ?? null} branches={branches} />
        <main className="flex flex-1 flex-col overflow-auto bg-background p-6">
          {children}
        </main>
      </SidebarInset>
      <Toaster position="bottom-right" richColors />
    </SidebarProvider>
  );
}
