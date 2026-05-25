CREATE TABLE IF NOT EXISTS division_template (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null references division(id) on delete cascade,
  template_id uuid not null references time_template(id),
  applies_to varchar not null check (applies_to in ('weekday','saturday')),
  created_at timestamp with time zone default now(),
  unique(division_id, applies_to)
);

ALTER TABLE division_template DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS timetable_activation (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null references division(id),
  segment_id uuid not null references academic_segment(id),
  status varchar not null default 'draft' check (status in ('draft','finalized')),
  finalized_at timestamp with time zone,
  finalized_by uuid references teacher(id),
  created_at timestamp with time zone default now(),
  unique(division_id, segment_id)
);

ALTER TABLE timetable_activation DISABLE ROW LEVEL SECURITY;

ALTER TABLE timetable_slot ADD COLUMN IF NOT EXISTS template_slot_id uuid references template_slot(id);
ALTER TABLE timetable_slot DROP COLUMN IF EXISTS start_time;
ALTER TABLE timetable_slot DROP COLUMN IF EXISTS end_time;
ALTER TABLE timetable_slot DROP COLUMN IF EXISTS effective_from;
ALTER TABLE timetable_slot DROP COLUMN IF EXISTS effective_to;

CREATE UNIQUE INDEX IF NOT EXISTS timetable_slot_division_template_day_idx
  ON timetable_slot(division_id, template_slot_id, day_of_week);
