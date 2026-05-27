-- Add soft delete columns (deleted_at and deleted_by) to multiple tables
ALTER TABLE IF EXISTS public.chapter
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.teacher(id);

ALTER TABLE IF EXISTS public.chapter_period
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.teacher(id);

ALTER TABLE IF EXISTS public.teacher_assignment
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.teacher(id);

ALTER TABLE IF EXISTS public.timetable_slot
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.teacher(id);

ALTER TABLE IF EXISTS public.academic_segment
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.teacher(id);

ALTER TABLE IF EXISTS public.subject
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.teacher(id);

ALTER TABLE IF EXISTS public.standard
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.teacher(id);

ALTER TABLE IF EXISTS public.division
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.teacher(id);

-- Create indexes for soft deletes
CREATE INDEX IF NOT EXISTS idx_chapter_deleted_at ON public.chapter(deleted_at);
CREATE INDEX IF NOT EXISTS idx_chapter_period_deleted_at ON public.chapter_period(deleted_at);
CREATE INDEX IF NOT EXISTS idx_teacher_assignment_deleted_at ON public.teacher_assignment(deleted_at);
CREATE INDEX IF NOT EXISTS idx_timetable_slot_deleted_at ON public.timetable_slot(deleted_at);
CREATE INDEX IF NOT EXISTS idx_academic_segment_deleted_at ON public.academic_segment(deleted_at);
CREATE INDEX IF NOT EXISTS idx_subject_deleted_at ON public.subject(deleted_at);
CREATE INDEX IF NOT EXISTS idx_standard_deleted_at ON public.standard(deleted_at);
CREATE INDEX IF NOT EXISTS idx_division_deleted_at ON public.division(deleted_at);
