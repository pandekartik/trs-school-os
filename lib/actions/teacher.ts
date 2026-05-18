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
