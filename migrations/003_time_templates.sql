-- Create time template and template slot tables
ALTER TABLE IF EXISTS public.time_template DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.template_slot DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.time_template (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  created_by uuid REFERENCES public.teacher(id),
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES public.teacher(id),
  days text[] DEFAULT '{}'::text[] NOT NULL
);

CREATE TABLE IF NOT EXISTS public.template_slot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.time_template(id),
  name varchar NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_type varchar NOT NULL CHECK (slot_type IN ('period', 'class', 'break', 'lunch', 'assembly')),
  display_order integer NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_time_template_created_by ON public.time_template(created_by);
CREATE INDEX IF NOT EXISTS idx_template_slot_template_id ON public.template_slot(template_id);
