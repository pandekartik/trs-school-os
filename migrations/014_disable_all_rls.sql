-- Disable RLS on all tables
-- The app enforces authentication and authorization entirely through server-side
-- logic and server actions, so database-level RLS is not needed and adds unnecessary
-- complexity. All access control is handled at the application layer.

ALTER TABLE public.school_year DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.standard DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.division DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignment DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_slot DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.holiday DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.period_instance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_absence DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coverage_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_segment DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_period DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_mcq DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_test DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_template DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_slot DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.division_template DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_activation DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log DISABLE ROW LEVEL SECURITY;
