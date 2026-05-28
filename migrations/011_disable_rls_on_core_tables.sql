-- Enable RLS with proper role-based access policies
-- This implements security by ensuring authenticated users can only access data based on their role
-- Admins (super_admin, admin) can perform all operations on setup tables
-- Coordinators and teachers can read most tables and manage operational data (periods, absences, etc.)

ALTER TABLE public.school_year ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.division ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_slot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holiday ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.period_instance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_absence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coverage_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_segment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_period ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_mcq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_test ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_slot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.division_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_activation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- School Year: Admins manage, all authenticated users can read
CREATE POLICY "Admins can manage school_year" ON public.school_year
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid() AND teacher.role IN ('super_admin', 'admin')));

CREATE POLICY "Authenticated users can read school_year" ON public.school_year
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid()));

-- Standard: Admins manage, all authenticated users can read
CREATE POLICY "Admins can manage standard" ON public.standard
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid() AND teacher.role IN ('super_admin', 'admin')));

CREATE POLICY "Authenticated users can read standard" ON public.standard
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid()));

-- Division: Admins manage, all authenticated users can read
CREATE POLICY "Admins can manage division" ON public.division
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid() AND teacher.role IN ('super_admin', 'admin')));

CREATE POLICY "Authenticated users can read division" ON public.division
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid()));

-- Subject: Admins manage, all authenticated users can read
CREATE POLICY "Admins can manage subject" ON public.subject
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid() AND teacher.role IN ('super_admin', 'admin')));

CREATE POLICY "Authenticated users can read subject" ON public.subject
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid()));

-- Teacher: Super admin manages all, authenticated users can read
CREATE POLICY "Super admin can manage all teachers" ON public.teacher
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.teacher t WHERE t.id = auth.uid() AND t.role = 'super_admin'));

CREATE POLICY "Authenticated users can read teachers" ON public.teacher
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid()));

-- Teacher Assignment: Admins manage, all authenticated users can read
CREATE POLICY "Admins can manage teacher_assignment" ON public.teacher_assignment
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid() AND teacher.role IN ('super_admin', 'admin')));

CREATE POLICY "Authenticated users can read teacher_assignment" ON public.teacher_assignment
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid()));

-- Timetable Slot: Admins manage, all authenticated users can read
CREATE POLICY "Admins can manage timetable_slot" ON public.timetable_slot
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid() AND teacher.role IN ('super_admin', 'admin')));

CREATE POLICY "Authenticated users can read timetable_slot" ON public.timetable_slot
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid()));

-- Holiday: Admins manage, all authenticated users can read
CREATE POLICY "Admins can manage holiday" ON public.holiday
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid() AND teacher.role IN ('super_admin', 'admin')));

CREATE POLICY "Authenticated users can read holiday" ON public.holiday
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid()));

-- Period Instance: All authenticated users can manage (for logging periods)
CREATE POLICY "Authenticated users can manage period_instance" ON public.period_instance
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid()));

-- Teacher Absence: All authenticated users can manage
CREATE POLICY "Authenticated users can manage teacher_absence" ON public.teacher_absence
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid()));

-- Coverage Summary: All authenticated users can read
CREATE POLICY "Authenticated users can read coverage_summary" ON public.coverage_summary
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid()));

-- Academic Segment: Admins manage, all authenticated users can read
CREATE POLICY "Admins can manage academic_segment" ON public.academic_segment
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid() AND teacher.role IN ('super_admin', 'admin')));

CREATE POLICY "Authenticated users can read academic_segment" ON public.academic_segment
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid()));

-- Chapter: All authenticated users can manage (for content creation)
CREATE POLICY "Authenticated users can manage chapter" ON public.chapter
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid()));

-- Chapter Period: All authenticated users can manage (for lesson planning)
CREATE POLICY "Authenticated users can manage chapter_period" ON public.chapter_period
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid()));

-- Chapter MCQ: All authenticated users can manage
CREATE POLICY "Authenticated users can manage chapter_mcq" ON public.chapter_mcq
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid()));

-- Chapter Test: All authenticated users can manage
CREATE POLICY "Authenticated users can manage chapter_test" ON public.chapter_test
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid()));

-- Time Template: Admins manage, all authenticated users can read
CREATE POLICY "Admins can manage time_template" ON public.time_template
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid() AND teacher.role IN ('super_admin', 'admin')));

CREATE POLICY "Authenticated users can read time_template" ON public.time_template
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid()));

-- Template Slot: Admins manage, all authenticated users can read
CREATE POLICY "Admins can manage template_slot" ON public.template_slot
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid() AND teacher.role IN ('super_admin', 'admin')));

CREATE POLICY "Authenticated users can read template_slot" ON public.template_slot
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid()));

-- Division Template: Admins manage, all authenticated users can read
CREATE POLICY "Admins can manage division_template" ON public.division_template
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid() AND teacher.role IN ('super_admin', 'admin')));

CREATE POLICY "Authenticated users can read division_template" ON public.division_template
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid()));

-- Timetable Activation: Admins manage, all authenticated users can read
CREATE POLICY "Admins can manage timetable_activation" ON public.timetable_activation
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid() AND teacher.role IN ('super_admin', 'admin')));

CREATE POLICY "Authenticated users can read timetable_activation" ON public.timetable_activation
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid()));

-- Audit Log: Authenticated users can read, super admin can manage
CREATE POLICY "Authenticated users can read audit_log" ON public.audit_log
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid()));

CREATE POLICY "Super admin can manage audit_log" ON public.audit_log
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.teacher WHERE teacher.id = auth.uid() AND teacher.role = 'super_admin'));
