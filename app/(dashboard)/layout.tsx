import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ShellTopbar } from "@/components/layout/page-header";
import { Toaster } from "@/components/ui/sonner";
import { getUser, getTeacherProfile, getActiveBranch } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";
import type { UserRole } from "@/lib/role-access";

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

  const isBranchSwitcher = role && ["super_admin", "admin"].includes(role);
  const [{ data: activeSchoolYear }, { data: branches }, activeBranch] = await Promise.all([
    admin
      .from("school_year")
      .select("name")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    isBranchSwitcher
      ? admin.from("branch").select("id, name").eq("is_active", true).order("name")
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    getActiveBranch(),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar
        role={role}
        teacherName={profile?.name ?? user.email ?? ""}
        branches={branches ?? []}
        activeBranchId={activeBranch?.id ?? null}
      />
      <SidebarInset className="overflow-hidden">
        <ShellTopbar role={role} schoolYearName={activeSchoolYear?.name ?? null} />
        <main className="flex flex-1 flex-col overflow-auto bg-background p-6">
          {children}
        </main>
      </SidebarInset>
      <Toaster position="bottom-right" richColors />
    </SidebarProvider>
  );
}
