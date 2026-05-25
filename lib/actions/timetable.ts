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
    const newSlots = slots.map((slot) => ({
      template_id: newTemplate.id,
      name: slot.name,
      start_time: slot.start_time,
      end_time: slot.end_time,
      slot_type: slot.slot_type,
      display_order: slot.display_order,
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

export async function assignDivisionTemplate(
  divisionId: string,
  templateId: string,
  appliesTo: string
) {
  const db = await getDb();
  if (!divisionId || !templateId) return { error: "Division and template are required" };
  if (appliesTo !== "weekday" && appliesTo !== "saturday") {
    return { error: "Invalid template assignment type" };
  }

  const { error } = await db
    .from("division_template")
    .upsert(
      {
        division_id: divisionId,
        template_id: templateId,
        applies_to: appliesTo,
      },
      { onConflict: "division_id,applies_to" }
    );

  if (error) return { error: error.message };
  revalidatePath("/timetable/builder");
  return { success: true };
}

export async function saveTimetableSlot(formData: FormData) {
  const db = await getDb();
  const division_id = String(formData.get("division_id") ?? "");
  const template_slot_id = String(formData.get("template_slot_id") ?? "");
  const subject_id = String(formData.get("subject_id") ?? "");
  const teacher_id = String(formData.get("teacher_id") ?? "");
  const day_of_week = String(formData.get("day_of_week") ?? "");

  if (!division_id || !template_slot_id || !subject_id || !teacher_id || !day_of_week) {
    return { error: "All slot fields are required" };
  }

  const [{ data: activeSchoolYears, error: schoolYearError }, { data: templateSlot, error: templateSlotError }] = await Promise.all([
    db
      .from("school_year")
      .select("id")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1),
    db
      .from("template_slot")
      .select("display_order")
      .eq("id", template_slot_id)
      .single(),
  ]);

  if (schoolYearError) return { error: schoolYearError.message };
  if (templateSlotError || !templateSlot) return { error: templateSlotError?.message ?? "Template slot not found" };

  const schoolYearId = activeSchoolYears?.[0]?.id;
  if (!schoolYearId) return { error: "No active school year found" };

  const { error } = await db
    .from("timetable_slot")
    .upsert(
      {
        school_year_id: schoolYearId,
        division_id,
        template_slot_id,
        subject_id,
        teacher_id,
        day_of_week,
        period_number: templateSlot.display_order,
      },
      { onConflict: "division_id,template_slot_id,day_of_week" }
    );

  if (error) return { error: error.message };
  revalidatePath("/timetable/builder");
  return { success: true };
}

export async function clearTimetableSlot(
  divisionId: string,
  templateSlotId: string,
  dayOfWeek: string
) {
  const db = await getDb();
  const { error } = await db
    .from("timetable_slot")
    .delete()
    .eq("division_id", divisionId)
    .eq("template_slot_id", templateSlotId)
    .eq("day_of_week", dayOfWeek);

  if (error) return { error: error.message };
  revalidatePath("/timetable/builder");
  return { success: true };
}

export async function finalizeTimetable(
  divisionId: string,
  segmentId: string,
  userId: string
) {
  const db = await getDb();
  const { error } = await db
    .from("timetable_activation")
    .upsert(
      {
        division_id: divisionId,
        segment_id: segmentId,
        status: "finalized",
        finalized_at: new Date().toISOString(),
        finalized_by: userId,
      },
      { onConflict: "division_id,segment_id" }
    );

  if (error) return { error: error.message };
  revalidatePath("/timetable/builder");
  return { success: true };
}

export async function draftTimetable(divisionId: string, segmentId: string) {
  const db = await getDb();
  const { error } = await db
    .from("timetable_activation")
    .update({ status: "draft" })
    .eq("division_id", divisionId)
    .eq("segment_id", segmentId);

  if (error) return { error: error.message };
  revalidatePath("/timetable/builder");
  return { success: true };
}

export async function getPreflightCheck(divisionId: string, segmentId: string) {
  const db = await getDb();
  const hard_blocks: Array<{ id: string; label: string; detail?: string }> = [];
  const warnings: Array<{ id: string; label: string; detail?: string }> = [];

  const [{ data: weekdayTemplate }, { data: segment }] = await Promise.all([
    db
      .from("division_template")
      .select("template_id")
      .eq("division_id", divisionId)
      .eq("applies_to", "weekday")
      .maybeSingle(),
    db
      .from("academic_segment")
      .select("id, start_date, end_date")
      .eq("id", segmentId)
      .maybeSingle(),
  ]);

  if (!weekdayTemplate?.template_id) {
    hard_blocks.push({
      id: "template_assigned",
      label: "Weekday template assigned",
      detail: "Assign a weekday template before finalizing.",
    });
  }

  if (!segment?.start_date || !segment?.end_date) {
    hard_blocks.push({
      id: "segment_dates",
      label: "Segment has valid dates",
      detail: "The selected segment needs both a start date and an end date.",
    });
  }

  if (weekdayTemplate?.template_id) {
    const [{ data: template }, { data: existingSlots }] = await Promise.all([
      db
        .from("time_template")
        .select("days, template_slot(id, slot_type)")
        .eq("id", weekdayTemplate.template_id)
        .single(),
      db
        .from("timetable_slot")
        .select("template_slot_id, day_of_week")
        .eq("division_id", divisionId),
    ]);

    const days = (template?.days ?? []) as string[];
    const templateSlots = ((template?.template_slot ?? []) as Array<{ id: string; slot_type: string }>)
      .filter((slot) => slot.slot_type === "period" || slot.slot_type === "class");
    const filled = new Set(
      (existingSlots ?? []).map((slot) => `${slot.template_slot_id}:${slot.day_of_week}`)
    );
    const unfilled = templateSlots.reduce((count, slot) => {
      return count + days.filter((day) => !filled.has(`${slot.id}:${day}`)).length;
    }, 0);

    if (unfilled > 0) {
      warnings.push({
        id: "slots_filled",
        label: "All class slots filled",
        detail: `${unfilled} slots unassigned`,
      });
    }
  }

  const { data: timetableSubjects } = await db
    .from("timetable_slot")
    .select("subject_id")
    .eq("division_id", divisionId);

  const subjectIds = [...new Set((timetableSubjects ?? []).map((slot) => slot.subject_id).filter(Boolean))];

  if (subjectIds.length > 0) {
    const [{ data: chapterRows }, { data: subjectRows }] = await Promise.all([
      db
        .from("chapter")
        .select("subject_id")
        .eq("academic_segment_id", segmentId)
        .in("subject_id", subjectIds),
      db
        .from("subject")
        .select("id, name, has_chapters")
        .in("id", subjectIds),
    ]);

    const subjectIdsWithChapters = new Set((chapterRows ?? []).map((chapter) => chapter.subject_id));
    const missingSubjects = (subjectRows ?? [])
      .filter((subject) => subject.has_chapters)
      .filter((subject) => !subjectIdsWithChapters.has(subject.id))
      .map((subject) => subject.name);

    if (missingSubjects.length > 0) {
      hard_blocks.push({
        id: "chapters_exist",
        label: "Chapters defined for all subjects",
        detail: `Missing chapters for: ${missingSubjects.join(", ")}`,
      });
    }
  }

  return { hard_blocks, warnings };
}
