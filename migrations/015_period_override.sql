-- Create period_override table for handling period substitutions, cancellations, and remappings

CREATE TABLE IF NOT EXISTS public.period_override (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_slot_id uuid NOT NULL REFERENCES public.timetable_slot(id),
  date date NOT NULL,
  override_type varchar NOT NULL CHECK (override_type IN ('substitute', 'cancel', 'topic_change', 'chapter_remap')),
  substitute_teacher_id uuid REFERENCES public.teacher(id),
  custom_topic varchar,
  chapter_id uuid REFERENCES public.chapter(id),
  chapter_period_number integer,
  reason text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.teacher(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for efficient querying by slot, date range, and teacher
CREATE INDEX IF NOT EXISTS idx_period_override_slot_date ON public.period_override(timetable_slot_id, date);
CREATE INDEX IF NOT EXISTS idx_period_override_date_range ON public.period_override(date);
CREATE INDEX IF NOT EXISTS idx_period_override_created_by ON public.period_override(created_by);
