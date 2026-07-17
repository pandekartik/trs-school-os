"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase-server";
import { getTodayIsoDate } from "@/lib/timetable-constants";
import { writeAuditLog, auditActions } from "@/lib/audit";
import { getTeacherProfile } from "@/lib/auth";
import type { LeaveRequest } from "@/lib/types";

async function getDb() {
  return await createServerClient();
}

export async function logPeriod(
  periodInstanceId: string,
  status: "done" | "partial" | "not_done",
  coverageNote: string,
  loggedBy: string
) {
  const db = await getDb();

  const { error } = await db
    .from("period_instance")
    .update({
      status,
      coverage_note: coverageNote || null,
      logged_by: loggedBy,
      logged_at: new Date().toISOString(),
    })
    .eq("id", periodInstanceId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/teacher");
  return { success: true };
}

export async function markAbsence(formData: FormData) {
  const db = await getDb();
  const teacherId = String(formData.get("teacher_id") ?? "");
  const substituteTeacherId = String(formData.get("substitute_teacher_id") ?? "");
  const absenceDate = String(formData.get("absence_date") ?? "");
  const reason = String(formData.get("reason") ?? "") || null;
  const markedBy = String(formData.get("marked_by") ?? "");

  // Insert absence record
  const { data: absence, error: absenceError } = await db
    .from("teacher_absence")
    .insert({
      teacher_id: teacherId,
      substitute_teacher_id: substituteTeacherId,
      absence_date: absenceDate,
      reason,
      marked_by: markedBy,
    })
    .select("id")
    .single();

  if (absenceError) {
    return { error: absenceError.message };
  }

  // Update period_instances for that day
  const { error: updateError } = await db
    .from("period_instance")
    .update({
      is_substituted: true,
      substitute_teacher_id: substituteTeacherId,
      teacher_id: substituteTeacherId,
    })
    .eq("teacher_id", teacherId)
    .eq("date", absenceDate)
    .eq("status", "scheduled");

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/teacher");
  return { success: true };
}

export async function deleteAbsence(
  absenceId: string,
  originalTeacherId: string,
  substituteTeacherId: string,
  absenceDate: string
) {
  const db = await getDb();

  // Delete absence record
  const { error: deleteError } = await db
    .from("teacher_absence")
    .delete()
    .eq("id", absenceId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  // Revert period_instances
  const { error: updateError } = await db
    .from("period_instance")
    .update({
      is_substituted: false,
      substitute_teacher_id: null,
      teacher_id: originalTeacherId,
    })
    .eq("teacher_id", substituteTeacherId)
    .eq("date", absenceDate)
    .eq("substitute_teacher_id", substituteTeacherId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/teacher");
  return { success: true };
}

export async function flagUnloggedPeriods() {
  const db = await getDb();
  const today = getTodayIsoDate();

  // Get yesterday's date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayIso = yesterday.toISOString().split("T")[0];

  const { error } = await db
    .from("period_instance")
    .update({ status: "unlogged" })
    .eq("status", "scheduled")
    .lt("date", today)
    .gte("date", yesterdayIso);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function markAttendance(formData: FormData) {
  const db = await getDb();
  const teacher_id = String(formData.get("teacher_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const status = String(formData.get("status") ?? "") as "present" | "absent" | "late" | "half_day";
  const reason = String(formData.get("reason") ?? "") || null;
  const marked_by = String(formData.get("marked_by") ?? "");
  const branch_id = String(formData.get("branch_id") ?? "") || null;

  if (!teacher_id || !date || !status || !marked_by) {
    return { error: "Required fields missing" };
  }

  const { error } = await db
    .from("teacher_attendance")
    .upsert(
      {
        teacher_id,
        date,
        status,
        reason,
        marked_by,
        branch_id,
        marked_at: new Date().toISOString(),
      },
      { onConflict: "teacher_id,date" }
    );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/teacher/attendance");
  return { success: true };
}

export async function bulkMarkAttendance(
  records: Array<{ teacher_id: string; date: string; status: string; reason: string }>,
  markedBy: string,
  branchId: string
) {
  const db = await getDb();

  if (!records || records.length === 0) {
    return { error: "No records to mark" };
  }

  const now = new Date().toISOString();
  const rows = records.map((record) => ({
    teacher_id: record.teacher_id,
    date: record.date,
    status: record.status as "present" | "absent" | "late" | "half_day",
    reason: record.reason || null,
    marked_by: markedBy,
    branch_id: branchId || null,
    marked_at: now,
  }));

  const { error } = await db
    .from("teacher_attendance")
    .upsert(rows, { onConflict: "teacher_id,date" });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/teacher/attendance");
  return { success: true };
}

// ── LEAVE REQUESTS ───────────────────────

export async function applyForLeave(formData: FormData) {
  const db = await getDb();
  const teacher_id     = formData.get("teacher_id") as string;
  const school_year_id = formData.get("school_year_id") as string;
  const branch_id      = (formData.get("branch_id") as string) || null;
  const leave_type     = formData.get("leave_type") as string;
  const from_date      = formData.get("from_date") as string;
  const to_date        = formData.get("to_date") as string;
  const total_days     = parseInt(formData.get("total_days") as string);
  const reason         = formData.get("reason") as string;

  const { data: existingLeaves } = await db
    .from("leave_request")
    .select("id, from_date, to_date")
    .eq("teacher_id", teacher_id)
    .eq("school_year_id", school_year_id)
    .in("status", ["pending", "approved"]);

  const overlaps = (existingLeaves ?? []).some(
    (leave) => !(to_date < leave.from_date || from_date > leave.to_date)
  );
  if (overlaps) {
    return { error: "You already have a leave request that overlaps with these dates" };
  }

  const { data: policy, error: policyError } = await db
    .from("leave_policy")
    .select("days_allowed")
    .eq("school_year_id", school_year_id)
    .eq("leave_type", leave_type)
    .single();

  if (policyError || !policy) {
    return { error: "Leave type not configured for this school year" };
  }

  const { data: balance } = await db
    .from("leave_balance")
    .select("used_days")
    .eq("teacher_id", teacher_id)
    .eq("school_year_id", school_year_id)
    .eq("leave_type", leave_type)
    .maybeSingle();

  const usedDays = balance?.used_days ?? 0;
  if (usedDays + total_days > policy.days_allowed) {
    return {
      error: `Insufficient leave balance. You have ${policy.days_allowed - usedDays} day(s) remaining for this leave type.`,
    };
  }

  const { data: inserted, error: insertError } = await db
    .from("leave_request")
    .insert({
      teacher_id, school_year_id, branch_id, leave_type,
      from_date, to_date, total_days, reason, status: "pending",
    })
    .select("id, display_id")
    .single();
  if (insertError) return { error: insertError.message };

  const profile = await getTeacherProfile();
  if (profile) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.leave.requested,
      entityType: "leave_request",
      entityId: inserted.id,
      entityLabel: inserted.display_id,
      newData: { leave_type, from_date, to_date, total_days, reason },
    });
  }

  revalidatePath("/teacher/leave");
  return { success: true };
}

export async function cancelLeaveRequest(id: string) {
  const db = await getDb();

  const { data: oldData } = await db.from("leave_request").select("*").eq("id", id).single();

  const { error } = await db
    .from("leave_request")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending");
  if (error) return { error: error.message };

  const profile = await getTeacherProfile();
  if (profile && oldData) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.leave.cancelled,
      entityType: "leave_request",
      entityId: id,
      entityLabel: oldData.display_id,
      oldData,
    });
  }

  revalidatePath("/teacher/leave");
  return { success: true };
}

export async function approveLeaveRequest(id: string, reviewedBy: string, substituteTeacherId?: string) {
  const db = await getDb();

  const { data: leaveRequest, error: fetchError } = await db
    .from("leave_request")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !leaveRequest) return { error: "Leave request not found" };

  const { error: updateError } = await db
    .from("leave_request")
    .update({
      status: "approved",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (updateError) return { error: updateError.message };

  const { data: existingBalance } = await db
    .from("leave_balance")
    .select("id, used_days")
    .eq("teacher_id", leaveRequest.teacher_id)
    .eq("school_year_id", leaveRequest.school_year_id)
    .eq("leave_type", leaveRequest.leave_type)
    .maybeSingle();

  if (existingBalance) {
    await db
      .from("leave_balance")
      .update({
        used_days: existingBalance.used_days + leaveRequest.total_days,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingBalance.id);
  } else {
    await db.from("leave_balance").insert({
      teacher_id: leaveRequest.teacher_id,
      school_year_id: leaveRequest.school_year_id,
      leave_type: leaveRequest.leave_type,
      used_days: leaveRequest.total_days,
    });
  }

  if (substituteTeacherId) {
    const result = await assignSubstitution(id, substituteTeacherId);
    if (result.error) return result;
  }

  const profile = await getTeacherProfile();
  if (profile) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.leave.approved,
      entityType: "leave_request",
      entityId: id,
      entityLabel: leaveRequest.display_id,
      oldData: leaveRequest,
      newData: { status: "approved", substitute_teacher_id: substituteTeacherId ?? null },
    });
  }

  revalidatePath("/teacher/leave");
  return { success: true };
}

export async function rejectLeaveRequest(id: string, reviewedBy: string, comment: string) {
  const db = await getDb();

  const { data: oldData } = await db.from("leave_request").select("*").eq("id", id).single();

  const { error } = await db
    .from("leave_request")
    .update({
      status: "rejected",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      review_comment: comment,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  const profile = await getTeacherProfile();
  if (profile && oldData) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.leave.rejected,
      entityType: "leave_request",
      entityId: id,
      entityLabel: oldData.display_id,
      oldData,
      newData: { status: "rejected", review_comment: comment },
    });
  }

  revalidatePath("/teacher/leave");
  return { success: true };
}

// ── SUBSTITUTIONS ────────────────────────

type SubstituteCandidate = { id: string; name: string; scheduled_periods: number };

export async function getSuggestedSubstitute(
  leaveRequestId: string
): Promise<{ candidates?: SubstituteCandidate[]; error?: string }> {
  const db = await getDb();

  const { data: leaveRequest } = await db
    .from("leave_request")
    .select("*")
    .eq("id", leaveRequestId)
    .single<LeaveRequest>();
  if (!leaveRequest) return { error: "Leave request not found" };

  const { data: candidateTeachers } = await db
    .from("teacher")
    .select("id, name, branch_id")
    .eq("is_active", true)
    .eq("role", "teacher")
    .neq("id", leaveRequest.teacher_id);

  if (!candidateTeachers || candidateTeachers.length === 0) return { candidates: [] };

  const sameBranch = leaveRequest.branch_id
    ? candidateTeachers.filter((t) => t.branch_id === leaveRequest.branch_id)
    : candidateTeachers;
  const pool = sameBranch.length > 0 ? sameBranch : candidateTeachers;

  const { data: existingLoad } = await db
    .from("period_instance")
    .select("teacher_id")
    .in("teacher_id", pool.map((t) => t.id))
    .gte("date", leaveRequest.from_date)
    .lte("date", leaveRequest.to_date)
    .neq("status", "cancelled");

  const loadByTeacher = new Map<string, number>();
  for (const row of existingLoad ?? []) {
    loadByTeacher.set(row.teacher_id, (loadByTeacher.get(row.teacher_id) ?? 0) + 1);
  }

  const candidates: SubstituteCandidate[] = pool
    .map((t) => ({ id: t.id, name: t.name, scheduled_periods: loadByTeacher.get(t.id) ?? 0 }))
    .sort((a, b) => a.scheduled_periods - b.scheduled_periods);

  return { candidates };
}

export async function assignSubstitution(leaveRequestId: string, substituteTeacherId: string) {
  const db = await getDb();

  const { data: leaveRequest } = await db
    .from("leave_request")
    .select("*")
    .eq("id", leaveRequestId)
    .single<LeaveRequest>();
  if (!leaveRequest) return { error: "Leave request not found" };

  const { data: periods } = await db
    .from("period_instance")
    .select("id, date")
    .eq("teacher_id", leaveRequest.teacher_id)
    .gte("date", leaveRequest.from_date)
    .lte("date", leaveRequest.to_date)
    .neq("status", "cancelled");

  for (const period of periods ?? []) {
    const { error: subError } = await db.from("substitution").upsert(
      {
        period_instance_id: period.id,
        leave_request_id: leaveRequestId,
        original_teacher_id: leaveRequest.teacher_id,
        substitute_teacher_id: substituteTeacherId,
        date: period.date,
        status: "assigned",
      },
      { onConflict: "period_instance_id" }
    );
    if (subError) return { error: subError.message };

    await db
      .from("period_instance")
      .update({ substitute_teacher_id: substituteTeacherId, is_substituted: true })
      .eq("id", period.id);
  }

  const profile = await getTeacherProfile();
  if (profile) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.leave.substituteAssigned,
      entityType: "leave_request",
      entityId: leaveRequestId,
      entityLabel: leaveRequest.display_id,
      newData: { substitute_teacher_id: substituteTeacherId, periods_affected: (periods ?? []).length },
    });
  }

  revalidatePath("/teacher/leave");
  return { success: true, periodsAffected: (periods ?? []).length };
}

export async function deleteAttendance(id: string) {
  const db = await getDb();

  const { error } = await db
    .from("teacher_attendance")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/teacher/attendance");
  return { success: true };
}
