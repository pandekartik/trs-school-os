import { getRole, getTeacherProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { LeaveShell } from "@/components/teacher/leave-shell";
import type { LeaveRequest, LeavePolicy, Branch } from "@/lib/types";

export default async function LeavePage() {
  const role = await getRole();
  const profile = await getTeacherProfile();

  if (!profile) {
    redirect("/");
  }

  const admin = createAdminClient();

  // Get active school year
  const { data: activeYear } = await admin
    .from("school_year")
    .select("*")
    .eq("is_active", true)
    .single() as { data: any };

  if (!activeYear) {
    redirect("/teacher");
  }

  // Get leave policies for active school year
  const { data: policies } = await admin
    .from("leave_policy")
    .select("*")
    .eq("school_year_id", activeYear.id)
    .order("leave_type") as { data: LeavePolicy[] | null };

  let leaveRequests: LeaveRequest[] = [];
  let teachers: any[] = [];
  let branches: Branch[] = [];
  let balances: any[] = [];
  let pendingCount = 0;

  if (role === "teacher") {
    // Teacher view: their own requests
    const { data: requests } = await admin
      .from("leave_request")
      .select("*")
      .eq("teacher_id", profile.id)
      .eq("school_year_id", activeYear.id)
      .order("created_at", { ascending: false }) as { data: LeaveRequest[] | null };

    leaveRequests = requests ?? [];

    // Get leave balances for this teacher
    const { data: balanceData } = await admin
      .from("leave_balance")
      .select("*")
      .eq("teacher_id", profile.id)
      .eq("school_year_id", activeYear.id) as { data: any[] | null };

    balances = balanceData ?? [];
  } else {
    // Admin/super_admin view: all requests across all branches
    const { data: requests } = await admin
      .from("leave_request")
      .select("*")
      .eq("school_year_id", activeYear.id)
      .order("created_at", { ascending: false }) as { data: LeaveRequest[] | null };

    leaveRequests = requests ?? [];

    // Get pending count
    const { count } = await admin
      .from("leave_request")
      .select("*", { count: "exact", head: true })
      .eq("school_year_id", activeYear.id)
      .eq("status", "pending") as { count: number | null };

    pendingCount = count ?? 0;

    // Get all teachers for filter dropdown
    const { data: teacherData } = await admin
      .from("teacher")
      .select("*")
      .eq("is_active", true)
      .eq("role", "teacher")
      .order("name") as { data: any[] | null };

    teachers = teacherData ?? [];

    // Get all branches for filter
    const { data: branchData } = await admin
      .from("branch")
      .select("*")
      .eq("is_active", true)
      .order("name") as { data: Branch[] | null };

    branches = branchData ?? [];
  }

  return (
    <LeaveShell
      role={role}
      profile={profile}
      leaveRequests={leaveRequests}
      policies={policies ?? []}
      balances={balances}
      teachers={teachers}
      branches={branches}
      branchId={profile.branch_id}
      schoolYearId={activeYear.id}
      pendingCount={pendingCount}
    />
  );
}
