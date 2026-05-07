
"use server";

import { createServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

const db = createServerClient();

// ── SCHOOL YEAR ──────────────────────────

export async function createSchoolYear(formData: FormData) {
  const name       = formData.get("name") as string;
  const start_date = formData.get("start_date") as string;
  const end_date   = formData.get("end_date") as string;

  const { error } = await db.from("school_year").insert({ name, start_date, end_date });
  if (error) return { error: error.message };

  revalidatePath("/setup");
  return { success: true };
}

export async function deleteSchoolYear(id: string) {
  const { error } = await db.from("school_year").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

export async function setActiveSchoolYear(id: string) {
  await db.from("school_year").update({ is_active: false }).neq("id", id);
  await db.from("school_year").update({ is_active: true }).eq("id", id);
  revalidatePath("/setup");
  return { success: true };
}

// ── TERMS ────────────────────────────────

export async function createTerm(formData: FormData) {
  const school_year_id = formData.get("school_year_id") as string;
  const name           = formData.get("name") as string;
  const term_number    = parseInt(formData.get("term_number") as string);
  const start_date     = formData.get("start_date") as string;
  const end_date       = formData.get("end_date") as string;

  const { error } = await db.from("term").insert({ school_year_id, name, term_number, start_date, end_date });
  if (error) return { error: error.message };

  revalidatePath("/setup");
  return { success: true };
}

export async function deleteTerm(id: string) {
  const { error } = await db.from("term").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

// ── STANDARDS ────────────────────────────

export async function createStandard(formData: FormData) {
  const name  = formData.get("name") as string;
  const grade = parseInt(formData.get("grade") as string);

  const { error } = await db.from("standard").insert({ name, grade });
  if (error) return { error: error.message };

  revalidatePath("/setup");
  return { success: true };
}

export async function deleteStandard(id: string) {
  const { error } = await db.from("standard").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

// ── DIVISIONS ────────────────────────────

export async function createDivision(formData: FormData) {
  const standard_id = formData.get("standard_id") as string;
  const name        = formData.get("name") as string;

  const { error } = await db.from("division").insert({ standard_id, name });
  if (error) return { error: error.message };

  revalidatePath("/setup");
  return { success: true };
}

export async function deleteDivision(id: string) {
  const { error } = await db.from("division").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

// ── SUBJECTS ─────────────────────────────

export async function createSubject(formData: FormData) {
  const standard_id      = formData.get("standard_id") as string;
  const name             = formData.get("name") as string;
  const type             = formData.get("type") as "academic" | "non_academic";
  const periods_per_week = parseInt(formData.get("periods_per_week") as string);
  const has_chapters     = formData.get("has_chapters") === "true";

  const { error } = await db.from("subject").insert({ standard_id, name, type, periods_per_week, has_chapters });
  if (error) return { error: error.message };

  revalidatePath("/setup");
  return { success: true };
}

export async function deleteSubject(id: string) {
  const { error } = await db.from("subject").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

// ── TEACHERS ─────────────────────────────

export async function createTeacher(formData: FormData) {
  const name  = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const role  = formData.get("role") as "teacher" | "hod" | "coordinator" | "admin";

  const { error } = await db.from("teacher").insert({ name, email, phone, role });
  if (error) return { error: error.message };

  revalidatePath("/setup");
  return { success: true };
}

export async function deleteTeacher(id: string) {
  const { error } = await db.from("teacher").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/setup");
  return { success: true };
}

// ── UNITS ────────────────────────────────

export async function createUnit(formData: FormData) {
  const term_id    = formData.get("term_id") as string;
  const subject_id = formData.get("subject_id") as string;
  const name       = formData.get("name") as string;
  const unit_number = parseInt(formData.get("unit_number") as string);

  const { error } = await db.from("unit").insert({
    term_id, subject_id, name, unit_number,
  });
  if (error) return { error: error.message };
  revalidatePath("/content");
  return { success: true };
}

export async function deleteUnit(id: string) {
  const { error } = await db.from("unit").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/content");
  return { success: true };
}

// ── CHAPTERS ─────────────────────────────

export async function createChapter(formData: FormData) {
  const unit_id          = formData.get("unit_id") as string;
  const chapter_number   = parseInt(formData.get("chapter_number") as string);
  const name             = formData.get("name") as string;
  const allocated_periods = parseInt(formData.get("allocated_periods") as string);
  const comments         = formData.get("comments") as string;
  const display_order    = chapter_number;
  // effective_periods is auto-computed by DB trigger
  const effective_periods = Math.floor(allocated_periods * 0.8);

  const { error } = await db.from("chapter").insert({
    unit_id, chapter_number, name,
    allocated_periods, effective_periods,
    comments, display_order,
  });
  if (error) return { error: error.message };
  revalidatePath("/content");
  return { success: true };
}

export async function deleteChapter(id: string) {
  const { error } = await db.from("chapter").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/content");
  return { success: true };
}

// ── CONTENT PACKAGE ───────────────────────

export async function saveContentPackage(formData: FormData) {
  const chapter_id       = formData.get("chapter_id") as string;
  const lesson_plan_body = formData.get("lesson_plan_body") as string;
  const reference_notes  = formData.get("reference_notes") as string;
  const uploaded_by      = formData.get("uploaded_by") as string;

  // Parse MCQ JSON if provided
  let mcq_set_json = null;
  const mcqRaw = formData.get("mcq_set_json") as string;
  if (mcqRaw) {
    try { mcq_set_json = JSON.parse(mcqRaw); } catch {}
  }

  // Check if package exists
  const { data: existing } = await db
    .from("content_package")
    .select("id")
    .eq("chapter_id", chapter_id)
    .single();

  if (existing) {
    const { error } = await db
      .from("content_package")
      .update({
        lesson_plan_body,
        reference_notes,
        mcq_set_json,
        last_updated_at: new Date().toISOString(),
      })
      .eq("chapter_id", chapter_id);
    if (error) return { error: error.message };
  } else {
    const { error } = await db.from("content_package").insert({
      chapter_id,
      lesson_plan_body,
      reference_notes,
      mcq_set_json,
      uploaded_by,
      is_published: false,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/content");
  return { success: true };
}

export async function togglePublishContent(chapter_id: string, is_published: boolean) {
  const { error } = await db
    .from("content_package")
    .update({ is_published })
    .eq("chapter_id", chapter_id);
  if (error) return { error: error.message };
  revalidatePath("/content");
  return { success: true };
}