-- Create timetable_activation table and update timetable_slot
ALTER TABLE IF EXISTS public.timetable_activation DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.timetable_activation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id uuid NOT NULL REFERENCES public.division(id),
  segment_id uuid NOT NULL REFERENCES public.academic_segment(id),
  status varchar DEFAULT 'draft' CHECK (status IN ('draft', 'finalized')),
  finalized_at timestamptz,
  finalized_by uuid REFERENCES public.teacher(id),
  created_at timestamptz DEFAULT now()
);

-- Add template_slot_id to timetable_slot if not already present
ALTER TABLE IF EXISTS public.timetable_slot
ADD COLUMN IF NOT EXISTS template_slot_id uuid REFERENCES public.template_slot(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_timetable_activation_division_id ON public.timetable_activation(division_id);
CREATE INDEX IF NOT EXISTS idx_timetable_activation_segment_id ON public.timetable_activation(segment_id);
CREATE INDEX IF NOT EXISTS idx_timetable_activation_status ON public.timetable_activation(status);
CREATE INDEX IF NOT EXISTS idx_timetable_slot_template_slot_id ON public.timetable_slot(template_slot_id);
