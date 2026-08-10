-- timetable_slot.period_number is populated from a template_slot's
-- display_order, which counts every row in a day's time template
-- (assembly/break/lunch included), not just teaching periods. Templates
-- with a morning assembly and a mid-day break already push display_order
-- past 9 well before the 9th actual period, so the original 1-9 check
-- constraint (sized for a bare 9-period day) rejects valid slots such as
-- "Period 8" whose display_order is 10.
ALTER TABLE timetable_slot DROP CONSTRAINT IF EXISTS timetable_slot_period_number_check;

ALTER TABLE timetable_slot ADD CONSTRAINT timetable_slot_period_number_check
  CHECK (period_number >= 1 AND period_number <= 40);
