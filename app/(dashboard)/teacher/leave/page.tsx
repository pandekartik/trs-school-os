import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { getRole, getTeacherProfile } from "@/lib/auth";
import { LeaveShell } from "@/components/teacher/leave-shell";
import type { LeavePolicy, LeaveBalance, LeaveRequest, SchoolYear } from "@/lib/types";

export default async function LeavePage() {
  const role = await getRole();
  const profile = await getTeacherProfile();
  if (!profile) redirect("/");

  const isReviewer = ["super_admin", "admin", "coordinator"].includes(role ?? "");

  const admin = createAdminClient();

  const { data: schoolYears } = await admin
    .from("school_year")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  const activeYear = ((schoolYears ?? []) as SchoolYear[])[0] ?? null;

  if (!activeYear) {
    return (
      <LeaveShell
        role={role}
        isReviewer={isReviewer}
        currentTeacherId={profile.id}
        activeSchoolYear={null}
        policies={[]}
        myRequests={[]}
        myBalances={[]}
        pendingRequests={[]}
        teachers={[]}
      />
    );
  }

  const [{ data: policies }, { data: myRequests }, { data: myBalances }, { data: teachers }] =
    await Promise.all([
      admin.from("leave_policy").select("*").eq("school_year_id", activeYear.id).order("leave_type"),
      admin
        .from("leave_request")
        .select("*")
        .eq("teacher_id", profile.id)
        .eq("school_year_id", activeYear.id)
        .order("created_at", { ascending: false }),
      admin
        .from("leave_balance")
        .select("*")
        .eq("teacher_id", profile.id)
        .eq("school_year_id", activeYear.id),
      admin.from("teacher").select("id, name, branch_id").eq("role", "teacher").eq("is_active", true),
    ]);

  let pendingRequests: LeaveRequest[] = [];
  if (isReviewer) {
    const { data } = await admin
      .from("leave_request")
      .select("*, teacher:teacher_id(name)")
      .eq("school_year_id", activeYear.id)
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    pendingRequests = (data ?? []) as unknown as LeaveRequest[];
  }

  return (
    <LeaveShell
      role={role}
      isReviewer={isReviewer}
      currentTeacherId={profile.id}
      activeSchoolYear={activeYear}
      policies={(policies ?? []) as LeavePolicy[]}
      myRequests={(myRequests ?? []) as LeaveRequest[]}
      myBalances={(myBalances ?? []) as LeaveBalance[]}
      pendingRequests={pendingRequests}
      teachers={teachers ?? []}
    />
  );
}
