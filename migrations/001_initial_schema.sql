-- Initial schema creation
-- This migration creates all core tables for the school management system

ALTER TABLE IF EXISTS public.school_year DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.standard DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.division DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subject DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teacher DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teacher_assignment DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.timetable_slot DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.holiday DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.period_instance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teacher_absence DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coverage_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.academic_segment DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chapter DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chapter_period DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chapter_mcq DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chapter_test DISABLE ROW LEVEL SECURITY;

-- Create school_year table
CREATE TABLE IF NOT EXISTS public.school_year (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create standard table
CREATE TABLE IF NOT EXISTS public.standard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  grade integer UNIQUE NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Create division table
CREATE TABLE IF NOT EXISTS public.division (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_id uuid NOT NULL REFERENCES public.standard(id),
  name varchar NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Create subject table
CREATE TABLE IF NOT EXISTS public.subject (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_id uuid NOT NULL REFERENCES public.standard(id),
  name varchar NOT NULL,
  type varchar NOT NULL CHECK (type IN ('academic', 'non_academic')),
  periods_per_week integer NOT NULL,
  has_chapters boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- Create teacher table
CREATE TABLE IF NOT EXISTS public.teacher (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  email varchar UNIQUE NOT NULL,
  phone varchar,
  role varchar NOT NULL CHECK (role IN ('super_admin', 'admin', 'coordinator', 'teacher')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create teacher_assignment table
CREATE TABLE IF NOT EXISTS public.teacher_assignment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teacher(id),
  subject_id uuid NOT NULL REFERENCES public.subject(id),
  division_id uuid NOT NULL REFERENCES public.division(id),
  school_year_id uuid NOT NULL REFERENCES public.school_year(id)
);

-- Create holiday table
CREATE TABLE IF NOT EXISTS public.holiday (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_year_id uuid NOT NULL REFERENCES public.school_year(id),
  date date NOT NULL,
  name varchar NOT NULL,
  type varchar NOT NULL CHECK (type IN ('national', 'school_event', 'exam', 'unplanned')),
  affects_all boolean DEFAULT true,
  division_id uuid REFERENCES public.division(id)
);

-- Create academic_segment table
CREATE TABLE IF NOT EXISTS public.academic_segment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_year_id uuid NOT NULL REFERENCES public.school_year(id),
  standard_id uuid NOT NULL REFERENCES public.standard(id),
  name varchar NOT NULL,
  segment_type varchar NOT NULL CHECK (segment_type IN ('unit', 'term')),
  sequence_number integer NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chapter table
CREATE TABLE IF NOT EXISTS public.chapter (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subject(id),
  academic_segment_id uuid NOT NULL REFERENCES public.academic_segment(id),
  chapter_number integer NOT NULL,
  name varchar NOT NULL,
  allocated_periods integer NOT NULL,
  effective_periods integer NOT NULL,
  comments varchar,
  display_order integer NOT NULL,
  status varchar DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  total_periods_done integer DEFAULT 0
);

-- Create chapter_period table
CREATE TABLE IF NOT EXISTS public.chapter_period (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.chapter(id),
  period_number integer NOT NULL,
  title varchar,
  lesson_plan_url text,
  lesson_plan_filename varchar,
  file_type varchar CHECK ((file_type IN ('pdf', 'docx', 'doc')) OR file_type IS NULL),
  uploaded_by uuid REFERENCES public.teacher(id),
  uploaded_at timestamptz,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create chapter_mcq table
CREATE TABLE IF NOT EXISTS public.chapter_mcq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid UNIQUE NOT NULL REFERENCES public.chapter(id),
  mcq_set_json jsonb,
  uploaded_by uuid REFERENCES public.teacher(id),
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chapter_test table
CREATE TABLE IF NOT EXISTS public.chapter_test (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid UNIQUE NOT NULL REFERENCES public.chapter(id),
  test_json jsonb,
  uploaded_by uuid REFERENCES public.teacher(id),
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create timetable_slot table
CREATE TABLE IF NOT EXISTS public.timetable_slot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_year_id uuid NOT NULL REFERENCES public.school_year(id),
  division_id uuid NOT NULL REFERENCES public.division(id),
  subject_id uuid NOT NULL REFERENCES public.subject(id),
  teacher_id uuid NOT NULL REFERENCES public.teacher(id),
  day_of_week varchar NOT NULL CHECK (day_of_week IN ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')),
  period_number integer NOT NULL CHECK (period_number >= 1 AND period_number <= 9)
);

-- Create period_instance table
CREATE TABLE IF NOT EXISTS public.period_instance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_slot_id uuid NOT NULL REFERENCES public.timetable_slot(id),
  chapter_id uuid REFERENCES public.chapter(id),
  chapter_period_sequence integer,
  date date NOT NULL,
  is_buffer boolean DEFAULT false,
  teacher_id uuid NOT NULL REFERENCES public.teacher(id),
  substitute_teacher_id uuid REFERENCES public.teacher(id),
  is_substituted boolean DEFAULT false,
  status varchar DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'done', 'partial', 'not_done', 'cancelled', 'unlogged')),
  coverage_note text,
  logged_by uuid REFERENCES public.teacher(id),
  logged_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create teacher_absence table
CREATE TABLE IF NOT EXISTS public.teacher_absence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teacher(id),
  substitute_teacher_id uuid NOT NULL REFERENCES public.teacher(id),
  absence_date date NOT NULL,
  reason text,
  marked_by uuid NOT NULL REFERENCES public.teacher(id),
  marked_at timestamptz DEFAULT now()
);

-- Create coverage_summary table
CREATE TABLE IF NOT EXISTS public.coverage_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teacher(id),
  division_id uuid NOT NULL REFERENCES public.division(id),
  subject_id uuid NOT NULL REFERENCES public.subject(id),
  week_start date NOT NULL,
  total_scheduled integer DEFAULT 0,
  total_done integer DEFAULT 0,
  total_partial integer DEFAULT 0,
  total_not_done integer DEFAULT 0,
  total_unlogged integer DEFAULT 0,
  total_cancelled integer DEFAULT 0,
  coverage_pct numeric,
  last_refreshed_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_school_year_is_active ON public.school_year(is_active);
CREATE INDEX IF NOT EXISTS idx_standard_grade ON public.standard(grade);
CREATE INDEX IF NOT EXISTS idx_division_standard_id ON public.division(standard_id);
CREATE INDEX IF NOT EXISTS idx_subject_standard_id ON public.subject(standard_id);
CREATE INDEX IF NOT EXISTS idx_teacher_email ON public.teacher(email);
CREATE INDEX IF NOT EXISTS idx_teacher_role ON public.teacher(role);
CREATE INDEX IF NOT EXISTS idx_teacher_assignment_teacher_id ON public.teacher_assignment(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignment_division_id ON public.teacher_assignment(division_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignment_school_year_id ON public.teacher_assignment(school_year_id);
CREATE INDEX IF NOT EXISTS idx_holiday_school_year_id ON public.holiday(school_year_id);
CREATE INDEX IF NOT EXISTS idx_academic_segment_school_year_id ON public.academic_segment(school_year_id);
CREATE INDEX IF NOT EXISTS idx_chapter_subject_id ON public.chapter(subject_id);
CREATE INDEX IF NOT EXISTS idx_chapter_academic_segment_id ON public.chapter(academic_segment_id);
CREATE INDEX IF NOT EXISTS idx_chapter_period_chapter_id ON public.chapter_period(chapter_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slot_school_year_id ON public.timetable_slot(school_year_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slot_division_id ON public.timetable_slot(division_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slot_teacher_id ON public.timetable_slot(teacher_id);
CREATE INDEX IF NOT EXISTS idx_period_instance_timetable_slot_id ON public.period_instance(timetable_slot_id);
CREATE INDEX IF NOT EXISTS idx_period_instance_date ON public.period_instance(date);
CREATE INDEX IF NOT EXISTS idx_period_instance_status ON public.period_instance(status);
CREATE INDEX IF NOT EXISTS idx_teacher_absence_teacher_id ON public.teacher_absence(teacher_id);
CREATE INDEX IF NOT EXISTS idx_coverage_summary_teacher_id ON public.coverage_summary(teacher_id);
CREATE INDEX IF NOT EXISTS idx_coverage_summary_week_start ON public.coverage_summary(week_start);
