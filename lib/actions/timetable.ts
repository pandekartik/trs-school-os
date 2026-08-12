"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase-admin";
import { getActiveBranch } from "@/lib/auth";

function getDb() {
  return createAdminClient();
}

// Helper functions for generating meaningful display IDs
const DAY_MAP: Record<string, string> = {
  monday: "M",
  tuesday: "T",
  wednesday: "W",
  thursday: "H",
  friday: "F",
  saturday: "S",
  mon: "M",
  tue: "T",
  wed: "W",
  thu: "H",
  fri: "F",
  sat: "S",
};

function generateSlotDisplayId(grade: number, divisionName: string, dayOfWeek: string, periodOrder: number): string {
  const dayInitial = DAY_MAP[dayOfWeek.toLowerCase()] || dayOfWeek.charAt(0).toUpperCase();
  const periodPadded = String(periodOrder).padStart(2, "0");
  return `${grade}${divisionName}-${dayInitial}-P${periodPadded}`;
}

function generateInstanceDisplayId(grade: number, divisionName: string, dayOfWeek: string, periodOrder: number, date: string): string {
  const dayInitial = DAY_MAP[dayOfWeek.toLowerCase()] || dayOfWeek.charAt(0).toUpperCase();
  const periodPadded = String(periodOrder).padStart(2, "0");
  const [year, month, day] = date.split("-");
  const dateSuffix = `${month}${day}`;
  return `${grade}${divisionName}-${dayInitial}-P${periodPadded}-${dateSuffix}`;
}

export async function createTimetable(formData: FormData) {
  const db = getDb();
  const name = String(formData.get("name") ?? "").trim();
  const school_year_id = String(formData.get("school_year_id") ?? "");
  const branch_id = String(formData.get("branch_id") ?? "") || null;

  if (!name) return { error: "Timetable name is required" };
  if (!school_year_id) return { error: "School year is required" };

  const display_id = `TT-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;

  const { data, error } = await db
    .from("timetable")
    .insert({
      name,
      school_year_id,
      branch_id,
      status: "draft",
      display_id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/timetable");
  return { success: true, id: data?.id };
}

export async function updateTimetable(id: string, formData: FormData) {
  const db = getDb();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) return { error: "Timetable name is required" };

  const { error } = await db
    .from("timetable")
    .update({ name })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/timetable");
  return { success: true };
}

export async function deleteTimetable(id: string) {
  const db = getDb();

  // Delete timetable_slot entries
  const { error: slotError } = await db
    .from("timetable_slot")
    .delete()
    .eq("timetable_id", id);

  if (slotError) return { error: slotError.message };

  // Delete timetable_day_template entries
  const { error: dayError } = await db
    .from("timetable_day_template")
    .delete()
    .eq("timetable_id", id);

  if (dayError) return { error: dayError.message };

  // Delete timetable_division entries
  const { error: divError } = await db
    .from("timetable_division")
    .delete()
    .eq("timetable_id", id);

  if (divError) return { error: divError.message };

  // Delete timetable
  const { error: timetableError } = await db
    .from("timetable")
    .delete()
    .eq("id", id);

  if (timetableError) return { error: timetableError.message };

  revalidatePath("/timetable");
  return { success: true };
}

export async function assignDivisionsToTimetable(timetableId: string, divisionIds: string[]) {
  const db = getDb();

  // Delete existing assignments
  const { error: deleteError } = await db
    .from("timetable_division")
    .delete()
    .eq("timetable_id", timetableId);

  if (deleteError) return { error: deleteError.message };

  // Insert new assignments
  if (divisionIds.length > 0) {
    const rows = divisionIds.map((divisionId) => ({
      timetable_id: timetableId,
      division_id: divisionId,
    }));

    const { error: insertError } = await db
      .from("timetable_division")
      .insert(rows);

    if (insertError) return { error: insertError.message };
  }

  revalidatePath("/timetable");
  return { success: true };
}

export async function saveDayTemplate(timetableId: string, dayOfWeek: string, templateId: string) {
  const db = getDb();

  const { error } = await db
    .from("timetable_day_template")
    .upsert(
      {
        timetable_id: timetableId,
        day_of_week: dayOfWeek,
        template_id: templateId,
      },
      { onConflict: "timetable_id,day_of_week" }
    );

  if (error) return { error: error.message };

  revalidatePath("/timetable");
  return { success: true };
}

export async function removeDayTemplate(timetableId: string, dayOfWeek: string) {
  const db = getDb();

  const { error } = await db
    .from("timetable_day_template")
    .delete()
    .eq("timetable_id", timetableId)
    .eq("day_of_week", dayOfWeek);

  if (error) return { error: error.message };

  revalidatePath("/timetable");
  return { success: true };
}

export async function saveTimetableSlot(formData: FormData) {
  const db = getDb();
  const timetable_id = String(formData.get("timetable_id") ?? "");
  const template_slot_id = String(formData.get("template_slot_id") ?? "");
  const subject_id = String(formData.get("subject_id") ?? "");
  const teacher_id = String(formData.get("teacher_id") ?? "");
  const day_of_week = String(formData.get("day_of_week") ?? "");
  const division_id = String(formData.get("division_id") ?? "");
  const school_year_id = String(formData.get("school_year_id") ?? "");
  const branch_id = String(formData.get("branch_id") ?? "") || null;

  if (!timetable_id || !template_slot_id || !subject_id || !teacher_id || !day_of_week || !division_id) {
    return { error: "All slot fields are required" };
  }

  // Fetch division with standard to get grade
  const { data: division, error: divisionError } = await db
    .from("division")
    .select("*, standard(grade)")
    .eq("id", division_id)
    .single();

  if (divisionError || !division) {
    return { error: "Division not found" };
  }

  // Fetch template_slot to get display_order
  const { data: templateSlot, error: templateError } = await db
    .from("template_slot")
    .select("display_order")
    .eq("id", template_slot_id)
    .single();

  if (templateError || !templateSlot) {
    return { error: "Template slot not found" };
  }

  // Generate display_id
  const standard = (division as any).standard as { grade: number };
  const display_id = generateSlotDisplayId(standard.grade, division.name, day_of_week, templateSlot.display_order);

  const { error } = await db
    .from("timetable_slot")
    .upsert(
      {
        timetable_id,
        template_slot_id,
        subject_id,
        teacher_id,
        day_of_week,
        division_id,
        school_year_id,
        branch_id,
        display_id,
        period_number: templateSlot.display_order,
      },
      { onConflict: "timetable_id,template_slot_id,day_of_week,division_id" }
    );

  if (error) return { error: error.message };

  revalidatePath("/timetable");
  return { success: true };
}

export async function clearTimetableSlot(
  timetableId: string,
  templateSlotId: string,
  dayOfWeek: string,
  divisionId: string
) {
  const db = getDb();

  const { error } = await db
    .from("timetable_slot")
    .delete()
    .eq("timetable_id", timetableId)
    .eq("template_slot_id", templateSlotId)
    .eq("day_of_week", dayOfWeek)
    .eq("division_id", divisionId);

  if (error) return { error: error.message };

  revalidatePath("/timetable");
  return { success: true };
}

export async function finalizeTimetable(timetableId: string, _userId: string) {
  const db = getDb();

  const { data: slots, error: slotsError } = await db
    .from("timetable_slot")
    .select("id")
    .eq("timetable_id", timetableId);
  if (slotsError) return { error: slotsError.message };

  const slotIds = (slots ?? []).map((slot: any) => slot.id);
  if (slotIds.length > 0) {
    const { count, error: countError } = await db
      .from("period_instance")
      .select("id", { count: "exact", head: true })
      .in("timetable_slot_id", slotIds);
    if (countError) return { error: countError.message };

    if (!count) {
      return {
        error:
          "No period instances have been generated for this timetable yet. Use \"Generate Schedule\" on each division before finalizing.",
      };
    }
  }

  const { error } = await db
    .from("timetable")
    .update({
      status: "finalized",
      finalized_at: new Date().toISOString(),
    })
    .eq("id", timetableId);

  if (error) return { error: error.message };

  revalidatePath("/timetable");
  return { success: true };
}

export async function draftTimetable(timetableId: string) {
  const db = getDb();

  const { error } = await db
    .from("timetable")
    .update({
      status: "draft",
      finalized_at: null,
    })
    .eq("id", timetableId);

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
  confirmOverwrite = false,
  startDate?: string
): Promise<ScheduleResult> {
  const db = getDb();

  const { data: activeSlots, error: slotError } = await db
    .from("timetable_slot")
    .select("*, template_slot(display_order)")
    .eq("division_id", divisionId)
    .eq("school_year_id", schoolYearId)
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

  // Optional floor on when generated periods actually begin, without
  // changing the segment's own (curriculum/reporting) date range.
  const effectiveStartDate =
    startDate && startDate > segment.start_date ? startDate : segment.start_date;
  if (effectiveStartDate > segment.end_date) {
    return { success: false, error: "Start date is after the segment's end date" };
  }

  const { data: division, error: divisionError } = await db
    .from("division")
    .select("*, standard(grade)")
    .eq("id", divisionId)
    .single();
  if (divisionError || !division) {
    return { success: false, error: divisionError?.message ?? "Division not found" };
  }

  const standard = (division as any).standard as { grade: number };

  const { data: holidays, error: holidayError } = await db
    .from("holiday")
    .select("date, end_date")
    .eq("school_year_id", schoolYearId)
    .lte("date", segment.end_date)
    .gte("end_date", effectiveStartDate)
    .or(`affects_all.eq.true,division_id.eq.${divisionId}`);
  if (holidayError) return { success: false, error: holidayError.message };

  const holidaySet = new Set<string>();
  for (const holiday of (holidays ?? []) as any[]) {
    const rangeStart = new Date(`${holiday.date}T00:00:00Z`);
    const rangeEnd = new Date(`${holiday.end_date}T00:00:00Z`);
    for (
      let cursor = new Date(rangeStart);
      cursor <= rangeEnd;
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    ) {
      holidaySet.add(cursor.toISOString().slice(0, 10));
    }
  }

  const { data: assignments, error: assignmentError } = await db
    .from("teacher_assignment")
    .select("subject_id")
    .eq("division_id", divisionId)
    .eq("school_year_id", schoolYearId);
  if (assignmentError) return { success: false, error: assignmentError.message };

  const assignedSubjectIds = [...new Set((assignments ?? []).map((assignment: any) => assignment.subject_id))];

  const { data: chapters, error: chapterError } = await db
    .from("chapter")
    .select("*")
    .eq("academic_segment_id", segmentId)
    .in("subject_id", assignedSubjectIds.length ? assignedSubjectIds : [""]);
  if (chapterError) return { success: false, error: chapterError.message };

  const slotIds = (activeSlots ?? []).map((slot: any) => slot.id);
  let existingCount = 0;
  if (slotIds.length > 0) {
    const { count, error: countError } = await db
      .from("period_instance")
      .select("id", { count: "exact", head: true })
      .in("timetable_slot_id", slotIds)
      .gte("date", effectiveStartDate)
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
      .gte("date", effectiveStartDate)
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
      .sort((a: any, b: any) => a.display_order - b.display_order || a.chapter_number - b.chapter_number)
      .forEach((chapter: any) => {
        for (let i = 1; i <= chapter.effective_periods; i += 1) {
          queue.push({ chapter_id: chapter.id, chapter_period_sequence: i });
        }
      });
    chapterQueues.set(subjectId, queue);
  }

  const slotByDay = new Map<string, typeof activeSlots>();
  for (const day of ["MON", "TUE", "WED", "THU", "FRI", "SAT"]) {
    slotByDay.set(day, (activeSlots ?? []).filter((slot: any) => slot.day_of_week === day.toLowerCase()));
  }

  const rows: Array<Record<string, unknown>> = [];
  const scheduledChapterIds = new Set<string>();
  let bufferCount = 0;

  const start = new Date(`${effectiveStartDate}T00:00:00Z`);
  const end = new Date(`${segment.end_date}T00:00:00Z`);

  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const isoDate = cursor.toISOString().slice(0, 10);
    const dayIndex = cursor.getUTCDay();
    if (dayIndex === 0 || dayIndex === 6) continue;
    if (holidaySet.has(isoDate)) continue;

    const dayKey = ["MON", "TUE", "WED", "THU", "FRI"][dayIndex - 1] as string;
    const daySlots = slotByDay.get(dayKey) ?? [];

    for (const slot of daySlots) {
      const queue = chapterQueues.get(slot.subject_id) ?? [];
      const next = queue.shift();
      const templateSlot = (slot as any).template_slot as { display_order: number };
      const display_id = generateInstanceDisplayId(
        standard.grade,
        division.name,
        dayKey,
        templateSlot.display_order,
        isoDate
      );

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
          display_id,
          branch_id: (slot as any).branch_id ?? null,
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
          display_id,
          branch_id: (slot as any).branch_id ?? null,
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

export async function savePeriodOverride(formData: FormData) {
  const db = getDb();
  const timetable_slot_id = String(formData.get("timetable_slot_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const override_type = String(formData.get("override_type") ?? "");
  const substitute_teacher_id = String(formData.get("substitute_teacher_id") ?? "") || null;
  const custom_topic = String(formData.get("custom_topic") ?? "") || null;
  const chapter_id = String(formData.get("chapter_id") ?? "") || null;
  const chapter_period_number = formData.get("chapter_period_number")
    ? parseInt(String(formData.get("chapter_period_number")), 10)
    : null;
  const reason = String(formData.get("reason") ?? "") || null;

  if (!timetable_slot_id || !date || !override_type) {
    return { error: "Required fields missing" };
  }

  const { error } = await db
    .from("period_override")
    .upsert(
      {
        timetable_slot_id,
        date,
        override_type,
        substitute_teacher_id,
        custom_topic,
        chapter_id,
        chapter_period_number,
        reason,
      },
      { onConflict: "timetable_slot_id,date" }
    );

  if (error) return { error: error.message };

  revalidatePath("/teacher");
  return { success: true };
}

export async function deletePeriodOverride(id: string) {
  const db = getDb();

  const { error } = await db
    .from("period_override")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/teacher");
  return { success: true };
}

export async function createHoliday(formData: FormData) {
  const db = getDb();

  const school_year_id = String(formData.get("school_year_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const end_date = String(formData.get("end_date") ?? "") || date;
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "school_event") as "national" | "school_event" | "exam" | "unplanned";
  const affects_all = String(formData.get("affects_all") ?? "") === "true";
  const division_id = affects_all ? null : String(formData.get("division_id") ?? "") || null;
  const activeBranch = await getActiveBranch();

  if (end_date < date) {
    return { error: "End date cannot be before the start date" };
  }

  const { error } = await db.from("holiday").insert({
    school_year_id,
    date,
    end_date,
    name,
    type,
    affects_all,
    division_id,
    branch_id: activeBranch?.id ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/timetable");
  return { success: true };
}

export async function updateHoliday(id: string, formData: FormData) {
  const db = getDb();
  const date = String(formData.get("date") ?? "");
  const end_date = String(formData.get("end_date") ?? "") || date;
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "school_event") as "national" | "school_event" | "exam" | "unplanned";
  const affects_all = String(formData.get("affects_all") ?? "") === "true";
  const division_id = affects_all ? null : String(formData.get("division_id") ?? "") || null;

  if (end_date < date) {
    return { error: "End date cannot be before the start date" };
  }

  const { error } = await db
    .from("holiday")
    .update({ date, end_date, name, type, affects_all, division_id })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/timetable");
  return { success: true };
}

export async function deleteHoliday(id: string) {
  const db = getDb();
  const { error } = await db.from("holiday").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/timetable");
  return { success: true };
}

export async function createTimeTemplate(formData: FormData) {
  const db = getDb();

  const name = String(formData.get("name") ?? "");
  const days = formData.getAll("days") as string[];

  if (!name) return { error: "Template name is required" };
  if (days.length === 0) return { error: "At least one day must be selected" };

  const activeBranch = await getActiveBranch();
  const { data, error } = await db
    .from("time_template")
    .insert([{ name, days, branch_id: activeBranch?.id ?? null }])
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
  const db = getDb();

  const { error: deleteError } = await db
    .from("template_slot")
    .delete()
    .eq("template_id", templateId);

  if (deleteError) return { error: deleteError.message };

  if (slots.length > 0) {
    const validSlotTypes = ["period", "class", "break", "lunch", "assembly"];
    const slotsData = slots.map((slot) => {
      const normalizedType = slot.slot_type.toLowerCase().trim();
      if (!validSlotTypes.includes(normalizedType)) {
        throw new Error(`Invalid slot_type: "${slot.slot_type}". Must be one of: ${validSlotTypes.join(", ")}`);
      }
      return {
        template_id: templateId,
        name: slot.name,
        start_time: slot.start_time,
        end_time: slot.end_time,
        slot_type: normalizedType,
        display_order: slot.display_order,
      };
    });

    const { error: insertError } = await db
      .from("template_slot")
      .insert(slotsData);

    if (insertError) return { error: insertError.message };
  }

  revalidatePath("/timetable/templates");
  return { success: true };
}

export async function deleteTimeTemplate(id: string) {
  const db = getDb();

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
  const db = getDb();

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
        branch_id: original.branch_id,
      },
    ])
    .select("id")
    .single();

  if (createError || !newTemplate) return { error: createError?.message };

  if (slots && slots.length > 0) {
    const newSlots = slots.map((slot: any) => ({
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
  const db = getDb();
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
  const db = getDb();

  const { error } = await db
    .from("template_slot")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/timetable/templates");
  return { success: true };
}
