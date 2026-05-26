-- Drop existing check constraint if it exists
ALTER TABLE timetable_slot DROP CONSTRAINT IF EXISTS timetable_slot_day_of_week_check;

-- Add new check constraint that allows three-letter day abbreviations
ALTER TABLE timetable_slot ADD CONSTRAINT timetable_slot_day_of_week_check
  CHECK (day_of_week IN ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'));
