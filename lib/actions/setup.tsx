"use server";

import { createServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/lib/role-access";

async function getDb() {
  return await createServerClient();
}

// ── SCHOOL YEAR ──────────────────────────

export async function createSchoolYear(formData: FormData) {
  const db = await getDb();
  const name       = formData.get("name") as string;
  const start_date = formData.get("start_date") as string;
  const end_date   = formData.get("end_date") as string;
  const { error }  = await db.from("school_year").insert({ name, start_date, end_date });
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

export async function updateSchoolYear(id: string, formData: FormData) {
  const db = await getDb();
  const name       = formData.get("name") as string;
  const start_date = formData.get("start_date") as string;
  const end_date   = formData.get("end_date") as string;
  const { error }  = await db.from("school_year")
    .update({ name, start_date, end_date, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

export async function deleteSchoolYear(id: string) {
  const db = await getDb();
  const { error } = await db.from("school_year").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

export async function setActiveSchoolYear(id: string) {
  const db = await getDb();
  await db.from("school_year").update({ is_active: false }).neq("id", id);
  await db.from("school_year").update({ is_active: true }).eq("id", id);
  revalidatePath("/setup");
  return { success: true };
}

// ── STANDARDS ────────────────────────────

export async function createStandard(formData: FormData) {
  const db = await getDb();
  const name  = formData.get("name") as string;
  const grade = parseInt(formData.get("grade") as string);
  const { error } = await db.from("standard").insert({ name, grade });
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

export async function updateStandard(id: string, formData: FormData) {
  const db = await getDb();
  const name  = formData.get("name") as string;
  const grade = parseInt(formData.get("grade") as string);
  const { error } = await db.from("standard")
    .update({ name, grade, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

export async function deleteStandard(id: string) {
  const db = await getDb();
  const { error } = await db.from("standard").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

// ── DIVISIONS ────────────────────────────

export async function createDivision(formData: FormData) {
  const db = await getDb();
  const standard_id = formData.get("standard_id") as string;
  const name        = formData.get("name") as string;
  const { error }   = await db.from("division").insert({ standard_id, name });
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

export async function updateDivision(id: string, formData: FormData) {
  const db = await getDb();
  const name      = formData.get("name") as string;
  const { error } = await db.from("division")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

export async function deleteDivision(id: string) {
  const db = await getDb();
  const { error } = await db.from("division").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

// ── ACADEMIC SEGMENTS ────────────────────

export async function createAcademicSegment(formData: FormData) {
  const db = await getDb();
  const school_year_id  = formData.get("school_year_id") as string;
  const standard_id     = formData.get("standard_id") as string;
  const name            = formData.get("name") as string;
  const segment_type    = formData.get("segment_type") as "unit" | "term";
  const sequence_number = parseInt(formData.get("sequence_number") as string);
  const start_date      = formData.get("start_date") as string;
  const end_date        = formData.get("end_date") as string;
  const { error } = await db.from("academic_segment").insert({
    school_year_id, standard_id, name,
    segment_type, sequence_number, start_date, end_date,
  });
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

export async function updateAcademicSegment(id: string, formData: FormData) {
  const db = await getDb();
  const name        = formData.get("name") as string;
  const start_date  = formData.get("start_date") as string;
  const end_date    = formData.get("end_date") as string;
  const { error }   = await db.from("academic_segment")
    .update({ name, start_date, end_date, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

export async function deleteAcademicSegment(id: string) {
  const db = await getDb();
  const { error } = await db.from("academic_segment").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

// ── SUBJECTS ─────────────────────────────

export async function createSubject(formData: FormData) {
  const db = await getDb();
  const standard_id      = formData.get("standard_id") as string;
  const name             = formData.get("name") as string;
  const type             = formData.get("type") as "academic" | "non_academic";
  const periods_per_week = parseInt(formData.get("periods_per_week") as string);
  const has_chapters     = formData.get("has_chapters") === "true";
  const { error } = await db.from("subject").insert({
    standard_id, name, type, periods_per_week, has_chapters,
  });
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

export async function updateSubject(id: string, formData: FormData) {
  const db = await getDb();
  const name             = formData.get("name") as string;
  const periods_per_week = parseInt(formData.get("periods_per_week") as string);
  const type             = formData.get("type") as "academic" | "non_academic";
  const has_chapters     = formData.get("has_chapters") === "true";
  const { error } = await db.from("subject")
    .update({ name, periods_per_week, type, has_chapters, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

export async function deleteSubject(id: string) {
  const db = await getDb();
  const { error } = await db.from("subject").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

// ── TEACHERS ─────────────────────────────

export async function createTeacher(formData: FormData) {
  const db = await getDb();
  const name  = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const role  = formData.get("role") as UserRole;
  const { error } = await db.from("teacher").insert({ name, email, phone, role });
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

export async function updateTeacher(id: string, formData: FormData) {
  const db = await getDb();
  const name  = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const role  = formData.get("role") as UserRole;
  const { error } = await db.from("teacher")
    .update({ name, phone, role, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

export async function deleteTeacher(id: string) {
  const db = await getDb();
  const { error } = await db.from("teacher").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

// ── TEACHER ASSIGNMENTS ───────────────────

export async function createTeacherAssignment(formData: FormData) {
  const db = await getDb();
  const teacher_id     = formData.get("teacher_id") as string;
  const subject_id     = formData.get("subject_id") as string;
  const division_id    = formData.get("division_id") as string;
  const school_year_id = formData.get("school_year_id") as string;
  const { error } = await db.from("teacher_assignment").insert({
    teacher_id, subject_id, division_id, school_year_id,
  });
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

export async function deleteTeacherAssignment(id: string) {
  const db = await getDb();
  const { error } = await db.from("teacher_assignment").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

// ── CHAPTERS ─────────────────────────────

export async function createChapter(formData: FormData) {
  const db = await getDb();
  const subject_id          = formData.get("subject_id") as string;
  const academic_segment_id = formData.get("academic_segment_id") as string;
  const chapter_number      = parseInt(formData.get("chapter_number") as string);
  const name                = formData.get("name") as string;
  const allocated_periods   = parseInt(formData.get("allocated_periods") as string);
  const comments            = (formData.get("comments") as string) || null;
  const { error } = await db.from("chapter").insert({
    subject_id, academic_segment_id, chapter_number,
    name, allocated_periods,
    comments, display_order: chapter_number,
  });
  if (error) return { error: error.message };
  revalidatePath("/content");
  return { success: true };
}

export async function updateChapter(id: string, formData: FormData) {
  const db = await getDb();
  const name              = formData.get("name") as string;
  const allocated_periods = parseInt(formData.get("allocated_periods") as string);
  const comments          = (formData.get("comments") as string) || null;
  const chapter_number    = parseInt(formData.get("chapter_number") as string);
  const { error } = await db.from("chapter")
    .update({
      name, allocated_periods,
      comments, chapter_number,
      display_order: chapter_number,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/content");
  return { success: true };
}

export async function deleteChapter(id: string) {
  const db = await getDb();
  const { error } = await db.from("chapter").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/content");
  return { success: true };
}

// ── CHAPTER PERIOD ────────────────────────

export async function saveChapterPeriod(formData: FormData) {
  const db = await getDb();
  const chapter_id    = formData.get("chapter_id") as string;
  const period_number = parseInt(formData.get("period_number") as string);
  const hasTitleField  = formData.has("title");
  const titleRaw       = formData.get("title");
  const title         = hasTitleField
    ? (typeof titleRaw === "string" && titleRaw.trim() ? titleRaw.trim() : null)
    : undefined;
  const uploaded_by   = (formData.get("uploaded_by") as string) || null;

  const { data: existing } = await db
    .from("chapter_period")
    .select("id, title")
    .eq("chapter_id", chapter_id)
    .eq("period_number", period_number)
    .single();

  if (existing) {
    const updateData: { title?: string | null } = {};
    if (title !== undefined) updateData.title = title;

    if (Object.keys(updateData).length > 0) {
      const { error } = await db
        .from("chapter_period")
        .update(updateData)
        .eq("id", existing.id);
      if (error) return { error: error.message };
    }

    revalidatePath("/content");
    return { success: true, chapter_period_id: existing.id };
  } else {
    const { data, error } = await db.from("chapter_period").insert({
      chapter_id, period_number, title: title ?? null, uploaded_by,
    }).select("id").single();
    if (error) return { error: error.message };
    revalidatePath("/content");
    return { success: true, chapter_period_id: data.id };
  }
}

export async function updateChapterPeriodFile(
  chapter_period_id: string,
  lesson_plan_url: string,
  lesson_plan_filename: string,
  file_type: string,
) {
  const db = await getDb();
  const { error } = await db
    .from("chapter_period")
    .update({
      lesson_plan_url,
      lesson_plan_filename,
      file_type,
      uploaded_at: new Date().toISOString(),
    })
    .eq("id", chapter_period_id);
  if (error) return { error: error.message };
  revalidatePath("/content");
  return { success: true };
}

export async function togglePeriodPublish(id: string, is_published: boolean) {
  const db = await getDb();
  const { error } = await db
    .from("chapter_period")
    .update({ is_published })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/content");
  return { success: true };
}

// ── MCQ ───────────────────────────────────

export async function saveMcq(formData: FormData) {
  const db = await getDb();
  const chapter_id  = formData.get("chapter_id") as string;
  const uploaded_by = (formData.get("uploaded_by") as string) || null;
  let mcq_set_json  = null;
  const raw = formData.get("mcq_set_json") as string;
  if (raw) { try { mcq_set_json = JSON.parse(raw); } catch {} }

  const { data: existing } = await db
    .from("chapter_mcq")
    .select("id")
    .eq("chapter_id", chapter_id)
    .single();

  if (existing) {
    const { error } = await db
      .from("chapter_mcq")
      .update({ mcq_set_json, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await db
      .from("chapter_mcq")
      .insert({ chapter_id, mcq_set_json, uploaded_by });
    if (error) return { error: error.message };
  }

  revalidatePath("/content");
  return { success: true };
}

// ── TEST ──────────────────────────────────

export async function saveTest(formData: FormData) {
  const db = await getDb();
  const chapter_id  = formData.get("chapter_id") as string;
  const uploaded_by = (formData.get("uploaded_by") as string) || null;
  let test_json     = null;
  const raw = formData.get("test_json") as string;
  if (raw) { try { test_json = JSON.parse(raw); } catch {} }

  const { data: existing } = await db
    .from("chapter_test")
    .select("id")
    .eq("chapter_id", chapter_id)
    .single();

  if (existing) {
    const { error } = await db
      .from("chapter_test")
      .update({ test_json, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await db
      .from("chapter_test")
      .insert({ chapter_id, test_json, uploaded_by });
    if (error) return { error: error.message };
  }

  revalidatePath("/content");
  return { success: true };
}
