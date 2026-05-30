"use server";

import { createServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/lib/role-access";
import { writeAuditLog, auditActions } from "@/lib/audit";
import { getTeacherProfile } from "@/lib/auth";

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

  const profile = await getTeacherProfile();
  if (profile) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.schoolYearCreated,
      entityType: "school_year",
      entityLabel: name,
      newData: { name, start_date, end_date },
    });
  }

  revalidatePath("/setup");
  return { success: true };
}

export async function updateSchoolYear(id: string, formData: FormData) {
  const db = await getDb();
  const name       = formData.get("name") as string;
  const start_date = formData.get("start_date") as string;
  const end_date   = formData.get("end_date") as string;

  const { data: oldData } = await db.from("school_year").select("*").eq("id", id).single();

  const { error }  = await db.from("school_year")
    .update({ name, start_date, end_date, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  const profile = await getTeacherProfile();
  if (profile) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.schoolYearUpdated,
      entityType: "school_year",
      entityId: id,
      entityLabel: name,
      oldData,
      newData: { name, start_date, end_date },
    });
  }

  revalidatePath("/setup");
  return { success: true };
}

export async function deleteSchoolYear(id: string) {
  const db = await getDb();
  const { data: oldData } = await db.from("school_year").select("*").eq("id", id).single();

  const { error } = await db.from("school_year").delete().eq("id", id);
  if (error) return { error: error.message };

  const profile = await getTeacherProfile();
  if (profile && oldData) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.schoolYearDeleted,
      entityType: "school_year",
      entityId: id,
      entityLabel: oldData.name,
      oldData,
    });
  }

  revalidatePath("/setup");
  return { success: true };
}

export async function setActiveSchoolYear(id: string) {
  const db = await getDb();
  const { data: schoolYear } = await db.from("school_year").select("*").eq("id", id).single();

  await db.from("school_year").update({ is_active: false }).neq("id", id);
  await db.from("school_year").update({ is_active: true }).eq("id", id);

  const profile = await getTeacherProfile();
  if (profile && schoolYear) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.schoolYearSetActive,
      entityType: "school_year",
      entityId: id,
      entityLabel: schoolYear.name,
      newData: { is_active: true },
    });
  }

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

  const profile = await getTeacherProfile();
  if (profile) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.standardCreated,
      entityType: "standard",
      entityLabel: name,
      newData: { name, grade },
    });
  }

  revalidatePath("/setup");
  return { success: true };
}

export async function updateStandard(id: string, formData: FormData) {
  const db = await getDb();
  const name  = formData.get("name") as string;
  const grade = parseInt(formData.get("grade") as string);

  const { data: oldData } = await db.from("standard").select("*").eq("id", id).single();

  const { error } = await db.from("standard")
    .update({ name, grade, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  const profile = await getTeacherProfile();
  if (profile) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.standardUpdated,
      entityType: "standard",
      entityId: id,
      entityLabel: name,
      oldData,
      newData: { name, grade },
    });
  }

  revalidatePath("/setup");
  return { success: true };
}

export async function deleteStandard(id: string) {
  const db = await getDb();
  const { data: oldData } = await db.from("standard").select("*").eq("id", id).single();

  const { error } = await db.from("standard").delete().eq("id", id);
  if (error) return { error: error.message };

  const profile = await getTeacherProfile();
  if (profile && oldData) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.standardDeleted,
      entityType: "standard",
      entityId: id,
      entityLabel: oldData.name,
      oldData,
    });
  }

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

  const profile = await getTeacherProfile();
  if (profile) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.divisionCreated,
      entityType: "division",
      entityLabel: name,
      newData: { standard_id, name },
    });
  }

  revalidatePath("/setup");
  return { success: true };
}

export async function updateDivision(id: string, formData: FormData) {
  const db = await getDb();
  const name      = formData.get("name") as string;

  const { data: oldData } = await db.from("division").select("*").eq("id", id).single();

  const { error } = await db.from("division")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  const profile = await getTeacherProfile();
  if (profile) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.divisionUpdated,
      entityType: "division",
      entityId: id,
      entityLabel: name,
      oldData,
      newData: { name },
    });
  }

  revalidatePath("/setup");
  return { success: true };
}

export async function deleteDivision(id: string) {
  const db = await getDb();
  const { data: oldData } = await db.from("division").select("*").eq("id", id).single();

  const { error } = await db.from("division").delete().eq("id", id);
  if (error) return { error: error.message };

  const profile = await getTeacherProfile();
  if (profile && oldData) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.divisionDeleted,
      entityType: "division",
      entityId: id,
      entityLabel: oldData.name,
      oldData,
    });
  }

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

  const profile = await getTeacherProfile();
  if (profile) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.segmentCreated,
      entityType: "segment",
      entityLabel: name,
      newData: { school_year_id, standard_id, name, segment_type, sequence_number, start_date, end_date },
    });
  }

  revalidatePath("/setup");
  return { success: true };
}

export async function updateAcademicSegment(id: string, formData: FormData) {
  const db = await getDb();
  const name        = formData.get("name") as string;
  const start_date  = formData.get("start_date") as string;
  const end_date    = formData.get("end_date") as string;

  const { data: oldData } = await db.from("academic_segment").select("*").eq("id", id).single();

  const { error }   = await db.from("academic_segment")
    .update({ name, start_date, end_date, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  const profile = await getTeacherProfile();
  if (profile) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.segmentUpdated,
      entityType: "segment",
      entityId: id,
      entityLabel: name,
      oldData,
      newData: { name, start_date, end_date },
    });
  }

  revalidatePath("/setup");
  return { success: true };
}

export async function deleteAcademicSegment(id: string) {
  const db = await getDb();
  const { data: oldData } = await db.from("academic_segment").select("*").eq("id", id).single();

  const { error } = await db.from("academic_segment").delete().eq("id", id);
  if (error) return { error: error.message };

  const profile = await getTeacherProfile();
  if (profile && oldData) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.segmentDeleted,
      entityType: "segment",
      entityId: id,
      entityLabel: oldData.name,
      oldData,
    });
  }

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

  const profile = await getTeacherProfile();
  if (profile) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.subjectCreated,
      entityType: "subject",
      entityLabel: name,
      newData: { standard_id, name, type, periods_per_week, has_chapters },
    });
  }

  revalidatePath("/setup");
  return { success: true };
}

export async function updateSubject(id: string, formData: FormData) {
  const db = await getDb();
  const name             = formData.get("name") as string;
  const periods_per_week = parseInt(formData.get("periods_per_week") as string);
  const type             = formData.get("type") as "academic" | "non_academic";
  const has_chapters     = formData.get("has_chapters") === "true";

  const { data: oldData } = await db.from("subject").select("*").eq("id", id).single();

  const { error } = await db.from("subject")
    .update({ name, periods_per_week, type, has_chapters, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  const profile = await getTeacherProfile();
  if (profile) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.subjectUpdated,
      entityType: "subject",
      entityId: id,
      entityLabel: name,
      oldData,
      newData: { name, periods_per_week, type, has_chapters },
    });
  }

  revalidatePath("/setup");
  return { success: true };
}

export async function deleteSubject(id: string) {
  const db = await getDb();
  const { data: oldData } = await db.from("subject").select("*").eq("id", id).single();

  const { error } = await db.from("subject").delete().eq("id", id);
  if (error) return { error: error.message };

  const profile = await getTeacherProfile();
  if (profile && oldData) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.subjectDeleted,
      entityType: "subject",
      entityId: id,
      entityLabel: oldData.name,
      oldData,
    });
  }

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

  const profile = await getTeacherProfile();
  if (profile) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.teacherCreated,
      entityType: "teacher",
      entityLabel: name,
      newData: { name, email, phone, role },
    });
  }

  revalidatePath("/setup");
  return { success: true };
}

export async function updateTeacher(id: string, formData: FormData) {
  const db = await getDb();
  const name  = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const role  = formData.get("role") as UserRole;

  const { data: oldData } = await db.from("teacher").select("*").eq("id", id).single();

  const { error } = await db.from("teacher")
    .update({ name, phone, role, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  const profile = await getTeacherProfile();
  if (profile) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.teacherUpdated,
      entityType: "teacher",
      entityId: id,
      entityLabel: name,
      oldData,
      newData: { name, phone, role },
    });
  }

  revalidatePath("/setup");
  return { success: true };
}

export async function deleteTeacher(id: string) {
  const db = await getDb();
  const { data: oldData } = await db.from("teacher").select("*").eq("id", id).single();

  const { error } = await db.from("teacher").delete().eq("id", id);
  if (error) return { error: error.message };

  const profile = await getTeacherProfile();
  if (profile && oldData) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.teacherDeleted,
      entityType: "teacher",
      entityId: id,
      entityLabel: oldData.name,
      oldData,
    });
  }

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

  const profile = await getTeacherProfile();
  if (profile) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.allocationCreated,
      entityType: "allocation",
      entityLabel: `teacher_id:${teacher_id}`,
      newData: { teacher_id, subject_id, division_id, school_year_id },
    });
  }

  revalidatePath("/setup");
  return { success: true };
}

export async function deleteTeacherAssignment(id: string) {
  const db = await getDb();
  const { data: oldData } = await db.from("teacher_assignment").select("*").eq("id", id).single();

  const { error } = await db.from("teacher_assignment").delete().eq("id", id);
  if (error) return { error: error.message };

  const profile = await getTeacherProfile();
  if (profile && oldData) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.allocationDeleted,
      entityType: "allocation",
      entityId: id,
      entityLabel: `teacher_id:${oldData.teacher_id}`,
      oldData,
    });
  }

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
    comments,
  });
  if (error) return { error: error.message };

  const profile = await getTeacherProfile();
  if (profile) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.chapterCreated,
      entityType: "chapter",
      entityLabel: name,
      newData: { subject_id, academic_segment_id, chapter_number, name, allocated_periods, comments },
    });
  }

  revalidatePath("/content");
  return { success: true };
}

export async function updateChapter(id: string, formData: FormData) {
  const db = await getDb();
  const name              = formData.get("name") as string;
  const allocated_periods = parseInt(formData.get("allocated_periods") as string);
  const comments          = (formData.get("comments") as string) || null;
  const chapter_number    = parseInt(formData.get("chapter_number") as string);

  const { data: oldData } = await db.from("chapter").select("*").eq("id", id).single();

  const { error } = await db.from("chapter")
    .update({
      name, allocated_periods,
      comments, chapter_number,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  const profile = await getTeacherProfile();
  if (profile) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.chapterUpdated,
      entityType: "chapter",
      entityId: id,
      entityLabel: name,
      oldData,
      newData: { name, allocated_periods, comments, chapter_number },
    });
  }

  revalidatePath("/content");
  return { success: true };
}

export async function deleteChapter(id: string) {
  const db = await getDb();
  const { data: oldData } = await db.from("chapter").select("*").eq("id", id).single();

  const { error } = await db.from("chapter").delete().eq("id", id);
  if (error) return { error: error.message };

  const profile = await getTeacherProfile();
  if (profile && oldData) {
    writeAuditLog({
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: auditActions.setup.chapterDeleted,
      entityType: "chapter",
      entityId: id,
      entityLabel: oldData.name,
      oldData,
    });
  }

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
