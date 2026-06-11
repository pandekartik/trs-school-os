/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase-server";
import { getTodayIsoDate } from "@/lib/timetable-constants";

async function getDb() {
  return await createServerClient();
}

export async function logPeriod(
  periodInstanceId: string,
  status: "done" | "partial" | "not_done",
  coverageNote: string,
  loggedBy: string,
  overrideChapterId?: string | null,
  overrideChapterPeriodNo?: number | null,
  chapterOverrideNote?: string | null
) {
  const db = await getDb();

  const updateData: Record<string, unknown> = {
    status,
    coverage_note: coverageNote || null,
    logged_by: loggedBy,
    logged_at: new Date().toISOString(),
  };

  if (overrideChapterId !== undefined) {
    updateData.override_chapter_id = overrideChapterId || null;
  }
  if (overrideChapterPeriodNo !== undefined) {
    updateData.override_chapter_period_no = overrideChapterPeriodNo || null;
  }
  if (chapterOverrideNote !== undefined) {
    updateData.chapter_override_note = chapterOverrideNote || null;
  }

  const { error } = await db
    .from("period_instance")
    .update(updateData)
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
  const { error: absenceError } = await db
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
<<<<<<< Updated upstream
=======

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

// ── LEAVE REQUESTS ──────────────────────

export async function applyForLeave(formData: FormData) {
  const db = await getDb();
  const teacher_id = formData.get("teacher_id") as string;
  const school_year_id = formData.get("school_year_id") as string;
  const branch_id = (formData.get("branch_id") as string) || null;
  const leave_type = formData.get("leave_type") as string;
  const from_date = formData.get("from_date") as string;
  const to_date = formData.get("to_date") as string;
  const total_days = parseInt(formData.get("total_days") as string);
  const reason = formData.get("reason") as string;

  // Check for overlapping leave requests (pending or approved)
  const { data: existingLeaves } = await db
    .from("leave_request")
    .select("id, from_date, to_date, status")
    .eq("teacher_id", teacher_id)
    .eq("school_year_id", school_year_id)
    .in("status", ["pending", "approved"]) as { data: any[] };

  if (existingLeaves && existingLeaves.length > 0) {
    for (const leave of existingLeaves) {
      const existingFrom = new Date(leave.from_date);
      const existingTo = new Date(leave.to_date);
      const newFrom = new Date(from_date);
      const newTo = new Date(to_date);

      if (!(newTo < existingFrom || newFrom > existingTo)) {
        return { error: "You already have a leave request that overlaps with these dates" };
      }
    }
  }

  // Check leave_policy exists
  const { data: policy, error: policyError } = await db
    .from("leave_policy")
    .select("days_allowed")
    .eq("school_year_id", school_year_id)
    .eq("leave_type", leave_type)
    .single();

  if (policyError || !policy) {
    return { error: "Leave type not configured for this school year" };
  }

  // Check leave_balance
  const { data: balance } = await db
    .from("leave_balance")
    .select("used_days")
    .eq("teacher_id", teacher_id)
    .eq("school_year_id", school_year_id)
    .eq("leave_type", leave_type)
    .single() as { data: { used_days: number } | null };

  const usedDays = balance?.used_days ?? 0;
  if (usedDays + total_days > policy.days_allowed) {
    return { error: `Insufficient leave balance. You have ${policy.days_allowed - usedDays} days remaining for this leave type.` };
  }

  const { error: insertError } = await db.from("leave_request").insert({
    teacher_id,
    school_year_id,
    branch_id,
    leave_type,
    from_date,
    to_date,
    total_days,
    reason,
    status: "pending",
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/teacher/leave");
  return { success: true };
}

export async function cancelLeaveRequest(id: string) {
  const db = await getDb();

  const { error } = await db
    .from("leave_request")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("status", "pending");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/teacher/leave");
  return { success: true };
}

export async function approveLeaveRequest(id: string, reviewedBy: string, substituteTeacherId?: string) {
  const db = await getDb();

  // Fetch the leave request
  const { data: leaveRequest, error: fetchError } = await db
    .from("leave_request")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !leaveRequest) {
    return { error: "Leave request not found" };
  }

  // Update status
  const { error: updateError } = await db
    .from("leave_request")
    .update({
      status: "approved",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return { error: updateError.message };
  }

  // Update leave_balance: increment used_days
  const { data: existingBalance } = await db
    .from("leave_balance")
    .select("id, used_days")
    .eq("teacher_id", leaveRequest.teacher_id)
    .eq("school_year_id", leaveRequest.school_year_id)
    .eq("leave_type", leaveRequest.leave_type)
    .single() as { data: { id: string; used_days: number } | null };

  if (existingBalance) {
    await db
      .from("leave_balance")
      .update({ used_days: existingBalance.used_days + leaveRequest.total_days })
      .eq("id", existingBalance.id);
  } else {
    await db.from("leave_balance").insert({
      teacher_id: leaveRequest.teacher_id,
      school_year_id: leaveRequest.school_year_id,
      leave_type: leaveRequest.leave_type,
      used_days: leaveRequest.total_days,
      created_at: new Date().toISOString(),
    });
  }

  // If substitute teacher provided, assign substitution
  if (substituteTeacherId) {
    const { data: periods } = await db
      .from("period_instance")
      .select("*")
      .eq("teacher_id", leaveRequest.teacher_id)
      .gte("date", leaveRequest.from_date)
      .lte("date", leaveRequest.to_date)
      .neq("status", "cancelled") as { data: any[] };

    if (periods && periods.length > 0) {
      for (const period of periods) {
        await db.from("substitution").upsert({
          period_instance_id: period.id,
          leave_request_id: id,
          original_teacher_id: leaveRequest.teacher_id,
          substitute_teacher_id: substituteTeacherId,
          date: period.date,
          status: "assigned",
        }, {
          onConflict: "period_instance_id",
        });

        await db
          .from("period_instance")
          .update({
            substitute_teacher_id: substituteTeacherId,
            is_substituted: true,
          })
          .eq("id", period.id);
      }
    }
  }

  revalidatePath("/teacher/leave");
  return { success: true, leaveRequestId: id };
}

export async function rejectLeaveRequest(id: string, reviewedBy: string, comment: string) {
  const db = await getDb();

  const { error } = await db
    .from("leave_request")
    .update({
      status: "rejected",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      review_comment: comment,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/teacher/leave");
  return { success: true };
}

// ── SUBSTITUTIONS ───────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSuggestedSubstitute(leaveRequestId: string, branchId: string): Promise<{ candidates?: any[]; error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = await getDb() as any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: leaveRequest } = await db
    .from("leave_request")
    .select("*")
    .eq("id", leaveRequestId)
    .single() as { data: any };

  if (!leaveRequest) {
    return { error: "Leave request not found" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: absencePeriods } = await db
    .from("period_instance")
    .select("timetable_slot_id, subject_id")
    .eq("teacher_id", leaveRequest.teacher_id)
    .gte("date", leaveRequest.from_date)
    .lte("date", leaveRequest.to_date) as { data: any[] };

  if (!absencePeriods || absencePeriods.length === 0) {
    return { candidates: [] };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: candidateTeachers } = await db
    .from("teacher")
    .select("*")
    .eq("branch_id", branchId)
    .eq("is_active", true)
    .neq("id", leaveRequest.teacher_id)
    .eq("role", "teacher") as { data: any[] };

  if (!candidateTeachers) {
    return { candidates: [] };
  }

  // Score each candidate
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidates = await Promise.all(
    candidateTeachers.map(async (candidate: any) => {
      // Check if on leave during dates
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: leaveConflict } = await db
        .from("leave_request")
        .select("id")
        .eq("teacher_id", candidate.id)
        .eq("status", "approved")
        .gte("from_date", leaveRequest.from_date)
        .lte("to_date", leaveRequest.to_date)
        .limit(1) as { data: any[] };

      if (leaveConflict && leaveConflict.length > 0) {
        return null;
      }

      // Count their load (period_instances) in date range
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: loadCount } = await db
        .from("period_instance")
        .select("*", { count: "exact" })
        .eq("teacher_id", candidate.id)
        .gte("date", leaveRequest.from_date)
        .lte("date", leaveRequest.to_date) as { count: number | null };

      const load = loadCount ?? 0;

      // Check subject match
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: assignments } = await db
        .from("teacher_assignment")
        .select("subject_id")
        .eq("teacher_id", candidate.id) as { data: any[] };

      const subjectIds = new Set((assignments ?? []).map((a) => a.subject_id));
      const absenceSubjectIds = new Set(absencePeriods.map((p) => p.subject_id));
      const matchingSubjects = [...absenceSubjectIds].filter((s) => subjectIds.has(s)).length;
      const subjectMatch = matchingSubjects > 0 ? matchingSubjects : 0;

      // Score
      const score = (subjectMatch * 2) + (10 - Math.min(load, 10));

      return {
        teacher: candidate,
        load,
        subjectMatch,
        score,
      };
    })
  );

  // Filter out nulls and sort by score
  const validCandidates = candidates
    .filter((c) => c !== null)
    .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))
    .slice(0, 5);

  return { candidates: validCandidates };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function assignSubstitution(leaveRequestId: string, substituteTeacherId: string): Promise<{ success?: boolean; count?: number; error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = await getDb() as any;

  // Fetch leave request
  const { data: leaveRequest } = await db
    .from("leave_request")
    .select("*")
    .eq("id", leaveRequestId)
    .single() as { data: any };

  if (!leaveRequest) {
    return { error: "Leave request not found" };
  }

  // Fetch all period_instances for absent teacher
  const { data: periods } = await db
    .from("period_instance")
    .select("*")
    .eq("teacher_id", leaveRequest.teacher_id)
    .gte("date", leaveRequest.from_date)
    .lte("date", leaveRequest.to_date)
    .neq("status", "cancelled") as { data: any[] };

  if (!periods || periods.length === 0) {
    return { success: true, count: 0 };
  }

  let count = 0;

  for (const period of periods) {
    // Upsert substitution
    await db.from("substitution").upsert({
      period_instance_id: period.id,
      leave_request_id: leaveRequestId,
      original_teacher_id: leaveRequest.teacher_id,
      substitute_teacher_id: substituteTeacherId,
      date: period.date,
      status: "assigned",
    }, {
      onConflict: "period_instance_id",
    });

    // Update period_instance
    await db
      .from("period_instance")
      .update({
        substitute_teacher_id: substituteTeacherId,
        is_substituted: true,
      })
      .eq("id", period.id);

    count++;
  }

  revalidatePath("/teacher/leave");
  revalidatePath("/teacher");
  return { success: true, count };
}
>>>>>>> Stashed changes
