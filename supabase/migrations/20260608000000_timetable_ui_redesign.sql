-- Create timetable table (main timetable entity)
CREATE TABLE IF NOT EXISTS timetable (
  id uuid primary key default gen_random_uuid(),
  display_id text not null unique,
  name text not null,
  school_year_id uuid not null references school_year(id) on delete cascade,
  branch_id uuid references branch(id) on delete set null,
  status varchar not null default 'draft' check (status in ('draft', 'finalized')),
  finalized_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

ALTER TABLE timetable DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_timetable_school_year ON timetable(school_year_id);
CREATE INDEX IF NOT EXISTS idx_timetable_branch ON timetable(branch_id);

-- Create timetable_division table (associates divisions with timetables)
CREATE TABLE IF NOT EXISTS timetable_division (
  id uuid primary key default gen_random_uuid(),
  timetable_id uuid not null references timetable(id) on delete cascade,
  division_id uuid not null references division(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(timetable_id, division_id)
);

ALTER TABLE timetable_division DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_timetable_division_timetable ON timetable_division(timetable_id);
CREATE INDEX IF NOT EXISTS idx_timetable_division_division ON timetable_division(division_id);

-- Create timetable_day_template table (day to template assignments)
CREATE TABLE IF NOT EXISTS timetable_day_template (
  id uuid primary key default gen_random_uuid(),
  timetable_id uuid not null references timetable(id) on delete cascade,
  day_of_week varchar not null check (day_of_week in ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')),
  template_id uuid not null references time_template(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(timetable_id, day_of_week)
);

ALTER TABLE timetable_day_template DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_timetable_day_template_timetable ON timetable_day_template(timetable_id);

-- Add timetable_id to timetable_slot if it doesn't exist
ALTER TABLE timetable_slot ADD COLUMN IF NOT EXISTS timetable_id uuid references timetable(id) on delete cascade;
ALTER TABLE timetable_slot ADD COLUMN IF NOT EXISTS branch_id uuid references branch(id) on delete set null;
CREATE INDEX IF NOT EXISTS idx_timetable_slot_timetable ON timetable_slot(timetable_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slot_branch ON timetable_slot(branch_id);

-- Create period_override table (overrides for specific periods)
CREATE TABLE IF NOT EXISTS period_override (
  id uuid primary key default gen_random_uuid(),
  timetable_slot_id uuid not null references timetable_slot(id) on delete cascade,
  date date not null,
  override_type varchar not null,
  substitute_teacher_id uuid references teacher(id) on delete set null,
  custom_topic text,
  chapter_id uuid references chapter(id) on delete set null,
  chapter_period_number integer,
  reason text,
  created_at timestamp with time zone default now(),
  unique(timetable_slot_id, date)
);

ALTER TABLE period_override DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_period_override_slot ON period_override(timetable_slot_id);
CREATE INDEX IF NOT EXISTS idx_period_override_date ON period_override(date);

-- Create teacher_attendance table (attendance tracking)
CREATE TABLE IF NOT EXISTS teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references teacher(id) on delete cascade,
  date date not null,
  status varchar not null check (status in ('present', 'absent', 'late', 'half_day')),
  reason text,
  marked_by uuid references teacher(id) on delete set null,
  created_at timestamp with time zone default now(),
  unique(teacher_id, date)
);

ALTER TABLE teacher_attendance DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_teacher ON teacher_attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_date ON teacher_attendance(date);
