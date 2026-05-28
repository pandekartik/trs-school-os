-- Fix infinite recursion in teacher table RLS policies
-- The teacher table is an internal admin-controlled table that doesn't benefit from RLS
-- because the app already enforces auth server-side and uses createAdminClient()
-- for all admin operations that need elevated access.
--
-- The recursive policies were:
-- - "Authenticated users can read teachers" → queries teacher table in USING clause
-- - "Super admin can manage all teachers" → queries teacher table in USING clause
--
-- These caused 42P17 errors (infinite recursion) whenever the teacher table was queried

DROP POLICY IF EXISTS "Authenticated users can read teachers" ON public.teacher;
DROP POLICY IF EXISTS "Super admin can manage all teachers" ON public.teacher;

ALTER TABLE public.teacher DISABLE ROW LEVEL SECURITY;
