-- Create template_slot table with proper constraints
CREATE TABLE IF NOT EXISTS template_slot (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references time_template(id) on delete cascade,
  name varchar not null,
  start_time varchar not null,
  end_time varchar not null,
  slot_type varchar not null check (slot_type in ('period', 'class', 'break', 'lunch', 'assembly')),
  display_order integer not null,
  created_at timestamp with time zone default now()
);

ALTER TABLE template_slot DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS template_slot_template_id_idx ON template_slot(template_id);
