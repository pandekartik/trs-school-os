"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase-server";
import {
  PERIOD_TIMES,
  TIMETABLE_DAYS,
  getTodayIsoDate,
  type TimetableDay,
} from "@/lib/timetable-constants";

async function getDb() {
  return await createServerClient();
}

function getPeriodTime(periodNumber: number) {
  return PERIOD_TIMES.find((period) => period.period === periodNumber);
}

function asBoolean(value: FormDataEntryValue | null) {
  return String(value ?? "") === "true";
}

export async function createTimetableSlot(formData: FormData) {
  const db = await getDb();
  const school_year_id = String(formData.get("school_year_id") ?? "");
  const division_id = String(formData.get("division_id") ?? "");
  const subject_id = String(formData.get("subject_id") ?? "");
  const teacher_id = String(formData.get("teacher_id") ?? "");
  const day_of_week = String(formData.get("day_of_week") ?? "") as TimetableDay;
  const period_number = parseInt(String(formData.get("period_number") ?? "0"), 10);
  const effective_from = String(formData.get("effective_from") ?? getTodayIsoDate());

  const time = getPeriodTime(period_number);
  if (!time) return { error: "Invalid period number" };
  if (!TIMETABLE_DAYS.includes(day_of_week)) return { error: "Invalid day of week" };

  const { data: existing } = await db
    .from("timetable_slot")
    .select("id")
    .eq("division_id", division_id)
    .eq("day_of_week", day_of_week)
    .eq("period_number", period_number)
    .is("effective_to", null)
    .maybeSingle();

  if (existing) {
    const { error: closeError } = await db
      .from("timetable_slot")
      .update({ effective_to: getTodayIsoDate() })
      .eq("id", existing.id);
    if (closeError) return { error: closeError.message };
  }

  const { error } = await db.from("timetable_slot").insert({
    school_year_id,
    division_id,
    subject_id,
    teacher_id,
    day_of_week,
    period_number,
    start_time: time.start,
    end_time: time.end,
    effective_from,
    effective_to: null,
  });

  if (error) return { error: error.message };
  revalidatePath("/timetable");
  return { success: true };
}

export async function deleteTimetableSlot(id: string) {
  const db = await getDb();
  const { error } = await db
    .from("timetable_slot")
    .update({ effective_to: getTodayIsoDate() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/timetable");
  return { success: true };
}

export async function createHoliday(formData: FormData) {
  const db = await getDb();
  const school_year_id = String(formData.get("school_year_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "school_event") as "national" | "school_event" | "exam" | "unplanned";
  const affects_all = asBoolean(formData.get("affects_all"));
  const division_id = affects_all ? null : String(formData.get("division_id") ?? "") || null;

  const { error } = await db.from("holiday").insert({
    school_year_id,
    date,
    name,
    type,
    affects_all,
    division_id,
  });
  if (error) return { error: error.message };
  revalidatePath("/timetable");
  return { success: true };
}

export async function updateHoliday(id: string, formData: FormData) {
  const db = await getDb();
  const date = String(formData.get("date") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "school_event") as "national" | "school_event" | "exam" | "unplanned";
  const affects_all = asBoolean(formData.get("affects_all"));
  const division_id = affects_all ? null : String(formData.get("division_id") ?? "") || null;

  const { error } = await db
    .from("holiday")
    .update({ date, name, type, affects_all, division_id })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/timetable");
  return { success: true };
}

export async function deleteHoliday(id: string) {
  const db = await getDb();
  const { error } = await db.from("holiday").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/timetable");
  return { success: true };
}

type ScheduleResult =
  | { success: true; created: number; buffer: number; scheduled_chapters: number; existingCount: number; requiresConfirmation?: false }
  | { success: false; error: string }
  | { success: false; requiresConfirmation: true; existingCount: number };

export async function generateSchedule(
  divisionId: string,
  segmentId: string,
  schoolYearId: string,
  confirmOverwrite = false
): Promise<ScheduleResult> {
  const db = await getDb();

  const { data: activeSlots, error: slotError } = await db
    .from("timetable_slot")
    .select("*")
    .eq("division_id", divisionId)
    .eq("school_year_id", schoolYearId)
    .is("effective_to", null)
    .order("day_of_week")
    .order("period_number");
  if (slotError) return { success: false, error: slotError.message };

  const { data: segment, error: segmentError } = await db
    .from("academic_segment")
    .select("*")
    .eq("id", segmentId)
    .single();
  if (segmentError || !segment) {
    return { success: false, error: segmentError?.message ?? "Segment not found" };
  }

  const { data: division, error: divisionError } = await db
    .from("division")
    .select("*")
    .eq("id", divisionId)
    .single();
  if (divisionError || !division) {
    return { success: false, error: divisionError?.message ?? "Division not found" };
  }

  const { data: holidays, error: holidayError } = await db
    .from("holiday")
    .select("date")
    .eq("school_year_id", schoolYearId)
    .gte("date", segment.start_date)
    .lte("date", segment.end_date)
    .or(`affects_all.eq.true,division_id.eq.${divisionId}`);
  if (holidayError) return { success: false, error: holidayError.message };

  const holidaySet = new Set((holidays ?? []).map((holiday) => holiday.date));

  const { data: assignments, error: assignmentError } = await db
    .from("teacher_assignment")
    .select("subject_id")
    .eq("division_id", divisionId)
    .eq("school_year_id", schoolYearId);
  if (assignmentError) return { success: false, error: assignmentError.message };

  const assignedSubjectIds = [...new Set((assignments ?? []).map((assignment) => assignment.subject_id))];

  const { data: chapters, error: chapterError } = await db
    .from("chapter")
    .select("*")
    .eq("academic_segment_id", segmentId)
    .in("subject_id", assignedSubjectIds.length ? assignedSubjectIds : [""]);
  if (chapterError) return { success: false, error: chapterError.message };

  const slotIds = (activeSlots ?? []).map((slot) => slot.id);
  let existingCount = 0;
  if (slotIds.length > 0) {
    const { count, error: countError } = await db
      .from("period_instance")
      .select("id", { count: "exact", head: true })
      .in("timetable_slot_id", slotIds)
      .gte("date", segment.start_date)
      .lte("date", segment.end_date);
    if (countError) return { success: false, error: countError.message };
    existingCount = count ?? 0;
  }

  if (existingCount && existingCount > 0 && !confirmOverwrite) {
    return { success: false, requiresConfirmation: true, existingCount };
  }

  if (slotIds.length > 0) {
    const { error: deleteError } = await db
      .from("period_instance")
      .delete()
      .in("timetable_slot_id", slotIds)
      .gte("date", segment.start_date)
      .lte("date", segment.end_date);
    if (deleteError) return { success: false, error: deleteError.message };
  }

  const chapterQueues = new Map<string, Array<{ chapter_id: string; chapter_period_sequence: number }>>();
  const chapterBySubject = new Map<string, typeof chapters>();
  for (const chapter of chapters ?? []) {
    const list = chapterBySubject.get(chapter.subject_id) ?? [];
    list.push(chapter);
    chapterBySubject.set(chapter.subject_id, list);
  }

  for (const [subjectId, subjectChapters] of chapterBySubject.entries()) {
    const queue: Array<{ chapter_id: string; chapter_period_sequence: number }> = [];
    [...subjectChapters]
      .sort((a, b) => a.display_order - b.display_order || a.chapter_number - b.chapter_number)
      .forEach((chapter) => {
        for (let i = 1; i <= chapter.effective_periods; i += 1) {
          queue.push({ chapter_id: chapter.id, chapter_period_sequence: i });
        }
      });
    chapterQueues.set(subjectId, queue);
  }

  const slotByDay = new Map<TimetableDay, typeof activeSlots>();
  for (const day of TIMETABLE_DAYS) {
    slotByDay.set(day, (activeSlots ?? []).filter((slot) => slot.day_of_week === day));
  }

  const rows: Array<Record<string, unknown>> = [];
  const scheduledChapterIds = new Set<string>();
  let bufferCount = 0;

  const start = new Date(`${segment.start_date}T00:00:00Z`);
  const end = new Date(`${segment.end_date}T00:00:00Z`);

  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const isoDate = cursor.toISOString().slice(0, 10);
    const dayIndex = cursor.getUTCDay();
    if (dayIndex === 0 || dayIndex === 6) continue;
    if (holidaySet.has(isoDate)) continue;

    const dayKey = ["MON", "TUE", "WED", "THU", "FRI"][dayIndex - 1] as TimetableDay;
    const daySlots = slotByDay.get(dayKey) ?? [];

    for (const slot of daySlots) {
      const queue = chapterQueues.get(slot.subject_id) ?? [];
      const next = queue.shift();
      if (next) {
        scheduledChapterIds.add(next.chapter_id);
        rows.push({
          timetable_slot_id: slot.id,
          chapter_id: next.chapter_id,
          chapter_period_sequence: next.chapter_period_sequence,
          date: isoDate,
          is_buffer: false,
          teacher_id: slot.teacher_id,
          substitute_teacher_id: null,
          is_substituted: false,
          status: "scheduled",
          coverage_note: null,
          logged_by: null,
          logged_at: null,
        });
      } else {
        bufferCount += 1;
        rows.push({
          timetable_slot_id: slot.id,
          chapter_id: null,
          chapter_period_sequence: null,
          date: isoDate,
          is_buffer: true,
          teacher_id: slot.teacher_id,
          substitute_teacher_id: null,
          is_substituted: false,
          status: "scheduled",
          coverage_note: null,
          logged_by: null,
          logged_at: null,
        });
      }
    }
  }

  if (rows.length > 0) {
    const { error: insertError } = await db.from("period_instance").insert(rows);
    if (insertError) return { success: false, error: insertError.message };
  }

  revalidatePath("/timetable");
  revalidatePath("/teacher");
  return {
    success: true,
    created: rows.length,
    buffer: bufferCount,
    scheduled_chapters: scheduledChapterIds.size,
    existingCount: existingCount ?? 0,
  };
}

export async function createTimeTemplate(formData: FormData) {
  const db = await getDb();
  const name = String(formData.get("name") ?? "");
  const days = formData.getAll("days") as string[];

  if (!name) return { error: "Template name is required" };
  if (days.length === 0) return { error: "At least one day must be selected" };

  const { data, error } = await db
    .from("time_template")
    .insert([{ name, days }])
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/timetable/templates");
  return { success: true, id: data?.id };
}

export async function saveAllSlots(
  templateId: string,
  slots: Array<{
    name: string;
    start_time: string;
    end_time: string;
    slot_type: string;
    display_order: number;
  }>
) {
  const db = await getDb();

  const { error: deleteError } = await db
    .from("template_slot")
    .delete()
    .eq("template_id", templateId);

  if (deleteError) return { error: deleteError.message };

  if (slots.length > 0) {
    const slotsData = slots.map((slot) => ({
      template_id: templateId,
      ...slot,
    }));

    const { error: insertError } = await db
      .from("template_slot")
      .insert(slotsData);

    if (insertError) return { error: insertError.message };
  }

  revalidatePath("/timetable/templates");
  return { success: true };
}

export async function deleteTimeTemplate(id: string) {
  const db = await getDb();

  const { error: deleteSlotError } = await db
    .from("template_slot")
    .delete()
    .eq("template_id", id);

  if (deleteSlotError) return { error: deleteSlotError.message };

  const { error: deleteTemplateError } = await db
    .from("time_template")
    .delete()
    .eq("id", id);

  if (deleteTemplateError) return { error: deleteTemplateError.message };

  revalidatePath("/timetable/templates");
  return { success: true };
}

export async function duplicateTimeTemplate(id: string) {
  const db = await getDb();

  const { data: original, error: fetchError } = await db
    .from("time_template")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !original) return { error: "Template not found" };

  const { data: slots, error: slotsError } = await db
    .from("template_slot")
    .select("*")
    .eq("template_id", id);

  if (slotsError) return { error: slotsError.message };

  const { data: newTemplate, error: createError } = await db
    .from("time_template")
    .insert([
      {
        name: `${original.name} (copy)`,
        days: original.days,
      },
    ])
    .select("id")
    .single();

  if (createError || !newTemplate) return { error: createError?.message };

  if (slots && slots.length > 0) {
    const newSlots = slots.map(({ id: _id, template_id, created_at, ...slot }) => ({
      template_id: newTemplate.id,
      ...slot,
    }));

    const { error: insertSlotsError } = await db
      .from("template_slot")
      .insert(newSlots);

    if (insertSlotsError) return { error: insertSlotsError.message };
  }

  revalidatePath("/timetable/templates");
  return { success: true, id: newTemplate.id };
}

export async function addTemplateSlot(formData: FormData) {
  const db = await getDb();
  const template_id = String(formData.get("template_id") ?? "");
  const name = String(formData.get("name") ?? "");
  const start_time = String(formData.get("start_time") ?? "");
  const end_time = String(formData.get("end_time") ?? "");
  const slot_type = String(formData.get("slot_type") ?? "");
  const display_order = parseInt(String(formData.get("display_order") ?? "0"), 10);

  if (!template_id || !name || !start_time || !end_time || !slot_type) {
    return { error: "All fields are required" };
  }

  const { data, error } = await db
    .from("template_slot")
    .insert([
      {
        template_id,
        name,
        start_time,
        end_time,
        slot_type,
        display_order,
      },
    ])
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/timetable/templates");
  return { success: true, id: data?.id };
}

export async function deleteTemplateSlot(id: string) {
  const db = await getDb();

  const { error } = await db
    .from("template_slot")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/timetable/templates");
  return { success: true };
}
