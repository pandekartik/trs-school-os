-- Update time_template table to ensure days column is properly configured
ALTER TABLE IF EXISTS public.time_template
DROP COLUMN IF EXISTS applies_to;

ALTER TABLE IF EXISTS public.time_template
ADD COLUMN IF NOT EXISTS days text[] NOT NULL DEFAULT '{}'::text[];
