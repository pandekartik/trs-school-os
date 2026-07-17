-- Reintroduce branch scoping (deliberately removed in e701d64) for the
-- entities that are branch-specific: school years, standards, divisions,
-- academic segments, and teacher attendance. Subjects, content (chapters/
-- lesson plans/MCQ/tests), and leave policies stay branch-agnostic by
-- design — shared across branches.
--
-- Only one branch exists in prod today, so backfilling every existing row
-- to it is unambiguous and lossless.

ALTER TABLE public.school_year ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branch(id);
ALTER TABLE public.standard ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branch(id);
ALTER TABLE public.division ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branch(id);
ALTER TABLE public.academic_segment ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branch(id);
ALTER TABLE public.teacher_attendance ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branch(id);

CREATE INDEX IF NOT EXISTS idx_school_year_branch ON public.school_year(branch_id);
CREATE INDEX IF NOT EXISTS idx_standard_branch ON public.standard(branch_id);
CREATE INDEX IF NOT EXISTS idx_division_branch ON public.division(branch_id);
CREATE INDEX IF NOT EXISTS idx_academic_segment_branch ON public.academic_segment(branch_id);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_branch ON public.teacher_attendance(branch_id);

-- Backfill: every existing row (across old and newly-added branch_id
-- columns) belongs to the single branch that exists today.
DO $$
DECLARE
  default_branch_id uuid;
BEGIN
  SELECT id INTO default_branch_id FROM public.branch ORDER BY created_at LIMIT 1;

  IF default_branch_id IS NOT NULL THEN
    UPDATE public.school_year SET branch_id = default_branch_id WHERE branch_id IS NULL;
    UPDATE public.standard SET branch_id = default_branch_id WHERE branch_id IS NULL;
    UPDATE public.division SET branch_id = default_branch_id WHERE branch_id IS NULL;
    UPDATE public.academic_segment SET branch_id = default_branch_id WHERE branch_id IS NULL;
    UPDATE public.teacher_attendance SET branch_id = default_branch_id WHERE branch_id IS NULL;
    UPDATE public.teacher SET branch_id = default_branch_id WHERE branch_id IS NULL;
    UPDATE public.teacher_assignment SET branch_id = default_branch_id WHERE branch_id IS NULL;
    UPDATE public.holiday SET branch_id = default_branch_id WHERE branch_id IS NULL;
    UPDATE public.time_template SET branch_id = default_branch_id WHERE branch_id IS NULL;
    UPDATE public.timetable SET branch_id = default_branch_id WHERE branch_id IS NULL;
    UPDATE public.timetable_slot SET branch_id = default_branch_id WHERE branch_id IS NULL;
    UPDATE public.timetable_activation SET branch_id = default_branch_id WHERE branch_id IS NULL;
  END IF;
END $$;
