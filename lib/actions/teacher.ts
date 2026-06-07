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
