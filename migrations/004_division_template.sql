-- Create division_template table
ALTER TABLE IF EXISTS public.division_template DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.division_template (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id uuid NOT NULL REFERENCES public.division(id),
  template_id uuid NOT NULL REFERENCES public.time_template(id),
  applies_to varchar NOT NULL CHECK (applies_to IN ('weekday', 'saturday')),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_division_template_division_id ON public.division_template(division_id);
CREATE INDEX IF NOT EXISTS idx_division_template_template_id ON public.division_template(template_id);
CREATE INDEX IF NOT EXISTS idx_division_template_applies_to ON public.division_template(applies_to);
