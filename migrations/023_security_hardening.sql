-- P1 security hardening from the audit:
-- 1. Pin search_path on all SECURITY-relevant trigger/helper functions so
--    they can't be redirected by a session-level search_path change.
-- 2. Revoke public EXECUTE on rls_auto_enable(), an internal migration
--    helper that should never have been callable via PostgREST RPC.

ALTER FUNCTION public.generate_branch_display_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_teacher_display_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_school_year_display_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_standard_display_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_division_display_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_subject_display_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_chapter_display_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_segment_display_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_leave_request_display_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_chapter_period_counts(uuid) SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
