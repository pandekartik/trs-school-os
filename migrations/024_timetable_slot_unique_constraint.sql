-- Fix P0 bug found via E2E test: saveTimetableSlot() upserts on
-- (timetable_id, template_slot_id, day_of_week, division_id), but no
-- matching unique constraint exists on timetable_slot -- every slot save
-- has always failed with "there is no unique or exclusion constraint
-- matching the ON CONFLICT specification". This explains why
-- timetable_slot has 0 rows in prod despite the full builder UI existing.

ALTER TABLE public.timetable_slot
  ADD CONSTRAINT timetable_slot_unique_cell
  UNIQUE (timetable_id, template_slot_id, day_of_week, division_id);
