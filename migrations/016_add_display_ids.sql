-- Add display_id columns for meaningful period identification

-- Add display_id to timetable_slot
ALTER TABLE public.timetable_slot
ADD COLUMN IF NOT EXISTS display_id varchar UNIQUE;

-- Create index for efficient display_id lookups
CREATE INDEX IF NOT EXISTS idx_timetable_slot_display_id ON public.timetable_slot(display_id);

-- Add display_id to period_instance
ALTER TABLE public.period_instance
ADD COLUMN IF NOT EXISTS display_id varchar;

-- Create index for efficient display_id lookups and date range queries
CREATE INDEX IF NOT EXISTS idx_period_instance_display_id ON public.period_instance(display_id);
CREATE INDEX IF NOT EXISTS idx_period_instance_display_id_date ON public.period_instance(display_id, date);
