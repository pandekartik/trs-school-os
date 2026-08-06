-- Chapter content (lesson-plan periods, MCQs, tests) is meant to be common
-- across branches, but it attaches to chapter rows and migration 025 gave
-- Viman Nagar its own chapter copies with no content. Copy the content rows
-- onto the matching Viman Nagar chapters. Lesson-plan files themselves are
-- not duplicated: the copied rows point at the same storage URLs.
--
-- Old->new chapter mapping is reconstructed by natural key (grade, subject
-- name, segment name + sequence, chapter number, display order, chapter
-- name, allocated/effective periods), verified unique across both branches.

DO $$
DECLARE
  src_branch uuid;
  dst_branch uuid;
  src_chapters int;
  mapped int;
BEGIN
  SELECT id INTO src_branch FROM public.branch WHERE name = 'Salunkhe Vihar';
  SELECT id INTO dst_branch FROM public.branch WHERE name = 'Viman Nagar';

  IF src_branch IS NULL OR dst_branch IS NULL THEN
    RAISE EXCEPTION 'Branch not found (Salunkhe Vihar: %, Viman Nagar: %)', src_branch, dst_branch;
  END IF;

  -- Idempotency guard: only run while Viman Nagar chapters have no content.
  IF EXISTS (
    SELECT 1 FROM public.chapter_period cp
    JOIN public.chapter c ON c.id = cp.chapter_id
    JOIN public.subject sub ON sub.id = c.subject_id
    JOIN public.standard s ON s.id = sub.standard_id
    WHERE s.branch_id = dst_branch
  ) THEN
    RAISE NOTICE 'Viman Nagar chapters already have content; skipping.';
    RETURN;
  END IF;

  CREATE TEMP TABLE ch_map AS
  WITH keyed AS (
    SELECT c.id, s.branch_id, s.grade, sub.name AS subject_name,
           seg.name AS seg_name, seg.sequence_number,
           c.chapter_number, c.display_order, c.name AS chapter_name,
           c.allocated_periods, c.effective_periods
    FROM public.chapter c
    JOIN public.subject sub ON sub.id = c.subject_id
    JOIN public.standard s ON s.id = sub.standard_id
    JOIN public.academic_segment seg ON seg.id = c.academic_segment_id
    WHERE c.deleted_at IS NULL AND sub.deleted_at IS NULL
  )
  SELECT o.id AS old_id, n.id AS new_id
  FROM keyed o
  JOIN keyed n USING (grade, subject_name, seg_name, sequence_number,
                      chapter_number, display_order, chapter_name,
                      allocated_periods, effective_periods)
  WHERE o.branch_id = src_branch AND n.branch_id = dst_branch;

  SELECT count(*) INTO src_chapters FROM public.chapter c
  JOIN public.subject sub ON sub.id = c.subject_id
  JOIN public.standard s ON s.id = sub.standard_id
  WHERE s.branch_id = src_branch AND c.deleted_at IS NULL AND sub.deleted_at IS NULL;

  SELECT count(*) INTO mapped FROM ch_map;
  IF mapped <> src_chapters OR mapped <> (SELECT count(DISTINCT new_id) FROM ch_map) THEN
    RAISE EXCEPTION 'Chapter mapping is not 1:1 (% source chapters, % mapped)', src_chapters, mapped;
  END IF;

  INSERT INTO public.chapter_period
    (chapter_id, period_number, title, lesson_plan_url, lesson_plan_filename,
     file_type, uploaded_by, uploaded_at, is_published, created_at)
  SELECT m.new_id, cp.period_number, cp.title, cp.lesson_plan_url, cp.lesson_plan_filename,
         cp.file_type, cp.uploaded_by, cp.uploaded_at, cp.is_published, cp.created_at
  FROM public.chapter_period cp
  JOIN ch_map m ON m.old_id = cp.chapter_id
  WHERE cp.deleted_at IS NULL;

  INSERT INTO public.chapter_mcq (chapter_id, mcq_set_json, uploaded_by, is_published)
  SELECT m.new_id, x.mcq_set_json, x.uploaded_by, x.is_published
  FROM public.chapter_mcq x JOIN ch_map m ON m.old_id = x.chapter_id;

  INSERT INTO public.chapter_test (chapter_id, test_json, uploaded_by, is_published)
  SELECT m.new_id, x.test_json, x.uploaded_by, x.is_published
  FROM public.chapter_test x JOIN ch_map m ON m.old_id = x.chapter_id;

  DROP TABLE ch_map;
END $$;
