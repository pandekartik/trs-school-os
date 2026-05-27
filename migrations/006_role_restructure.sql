-- Update teacher role constraint to include super_admin
-- First drop the existing constraint
ALTER TABLE IF EXISTS public.teacher
DROP CONSTRAINT IF EXISTS teacher_role_check;

-- Add updated constraint with all role values
ALTER TABLE IF EXISTS public.teacher
ADD CONSTRAINT teacher_role_check CHECK (role IN ('super_admin', 'admin', 'coordinator', 'teacher'));
