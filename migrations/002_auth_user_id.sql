-- Add auth_user_id to teacher table and create index
ALTER TABLE IF EXISTS public.teacher
ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_teacher_auth_user_id ON public.teacher(auth_user_id);
