-- Teachers can leave or a subject may not have a teacher allocated yet.
-- Timetable slots (and the period instances generated from them) must
-- still be creatable/generatable in that case, with the teacher left
-- unallocated and assignable later.

ALTER TABLE public.timetable_slot
  ALTER COLUMN teacher_id DROP NOT NULL;

ALTER TABLE public.period_instance
  ALTER COLUMN teacher_id DROP NOT NULL;
