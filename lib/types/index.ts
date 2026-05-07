export type SchoolYear = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
};

export type Term = {
  id: string;
  school_year_id: string;
  name: string;
  term_number: number;
  start_date: string;
  end_date: string;
};

export type Standard = {
  id: string;
  name: string;
  grade: number;
};

export type Division = {
  id: string;
  standard_id: string;
  name: string;
};

export type Subject = {
  id: string;
  standard_id: string;
  name: string;
  type: "academic" | "non_academic";
  periods_per_week: number;
  has_chapters: boolean;
};

export type Unit = {
  id: string;
  term_id: string;
  subject_id: string;
  name: string;
  unit_number: number;
};

export type Chapter = {
  id: string;
  unit_id: string;
  chapter_number: number;
  name: string;
  allocated_periods: number;
  effective_periods: number;
  comments: string | null;
  display_order: number;
  status: "not_started" | "in_progress" | "completed";
};

export type Teacher = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "teacher" | "hod" | "coordinator" | "admin";
  is_active: boolean;
  created_at: string;
};

export type TeacherAssignment = {
  id: string;
  teacher_id: string;
  subject_id: string;
  division_id: string;
  school_year_id: string;
};

export type ContentPackage = {
  id: string;
  chapter_id: string;
  lesson_plan_body: string | null;
  lesson_plan_doc_url: string | null;
  mcq_set_json: any | null;
  test_json: any | null;
  reference_notes: string | null;
  uploaded_by: string;
  is_published: boolean;
  uploaded_at: string;
  last_updated_at: string;
};

export type TimetableSlot = {
  id: string;
  school_year_id: string;
  division_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: "MON" | "TUE" | "WED" | "THU" | "FRI";
  period_number: number;
  start_time: string;
  end_time: string;
  effective_from: string;
  effective_to: string | null;
};

export type Holiday = {
  id: string;
  school_year_id: string;
  date: string;
  name: string;
  type: "national" | "school_event" | "exam" | "unplanned";
  affects_all: boolean;
  division_id: string | null;
};

export type PeriodInstance = {
  id: string;
  timetable_slot_id: string;
  chapter_id: string | null;
  chapter_period_sequence: number | null;
  date: string;
  is_buffer: boolean;
  teacher_id: string;
  substitute_teacher_id: string | null;
  is_substituted: boolean;
  status: "scheduled" | "done" | "partial" | "not_done" | "cancelled" | "unlogged";
  coverage_note: string | null;
  logged_by: string | null;
  logged_at: string | null;
  created_at: string;
};

export type TeacherAbsence = {
  id: string;
  teacher_id: string;
  substitute_teacher_id: string;
  absence_date: string;
  reason: string | null;
  marked_by: string;
  marked_at: string;
};

export type CoverageSummary = {
  id: string;
  teacher_id: string;
  division_id: string;
  subject_id: string;
  week_start: string;
  total_scheduled: number;
  total_done: number;
  total_partial: number;
  total_not_done: number;
  total_unlogged: number;
  total_cancelled: number;
  coverage_pct: number;
  last_refreshed_at: string;
};