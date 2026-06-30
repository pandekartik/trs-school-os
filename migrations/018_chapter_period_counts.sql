-- Per-chapter lesson-plan counts for the content dashboard list.
-- Returns one row per chapter (for the given school year) with the number of
-- periods that have an uploaded lesson plan and the number that are published.
-- This lets the /content list render progress/status without loading every
-- chapter_period row into the page (which previously broke at >1000 rows).

CREATE OR REPLACE FUNCTION public.get_chapter_period_counts(p_school_year_id uuid)
RETURNS TABLE (
  chapter_id      uuid,
  uploaded_count  integer,
  published_count integer
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    cp.chapter_id,
    COUNT(*) FILTER (WHERE cp.lesson_plan_url IS NOT NULL)::int AS uploaded_count,
    COUNT(*) FILTER (WHERE cp.lesson_plan_url IS NOT NULL AND cp.is_published)::int AS published_count
  FROM public.chapter_period cp
  JOIN public.chapter ch  ON ch.id  = cp.chapter_id
  JOIN public.academic_segment seg ON seg.id = ch.academic_segment_id
  WHERE seg.school_year_id = p_school_year_id
    AND cp.deleted_at IS NULL
    AND ch.deleted_at IS NULL
  GROUP BY cp.chapter_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_chapter_period_counts(uuid)
  TO anon, authenticated, service_role;
