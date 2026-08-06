-- Seed the Viman Nagar branch by copying the academic setup from Salunkhe
-- Vihar: school year, standards, academic segments, subjects, and chapters.
-- Copies get fresh UUIDs (display_ids regenerate via the BEFORE INSERT
-- triggers) and remapped foreign keys. Chapter teaching progress (status,
-- total_periods_done) resets since Viman Nagar hasn't taught anything yet.
-- Divisions, teachers, timetables, and lesson-plan content are not copied.
--
-- standard.grade was globally UNIQUE, which made it impossible for a second
-- branch to have its own Grade 1-10 rows; uniqueness is now per branch.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'standard_grade_key') THEN
    ALTER TABLE public.standard DROP CONSTRAINT standard_grade_key;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'standard_branch_grade_key') THEN
    ALTER TABLE public.standard ADD CONSTRAINT standard_branch_grade_key UNIQUE (branch_id, grade);
  END IF;
END $$;

DO $$
DECLARE
  src_branch uuid;
  dst_branch uuid;
BEGIN
  SELECT id INTO src_branch FROM public.branch WHERE name = 'Salunkhe Vihar';
  SELECT id INTO dst_branch FROM public.branch WHERE name = 'Viman Nagar';

  IF src_branch IS NULL OR dst_branch IS NULL THEN
    RAISE EXCEPTION 'Branch not found (Salunkhe Vihar: %, Viman Nagar: %)', src_branch, dst_branch;
  END IF;

  -- Idempotency guard: only seed an empty branch.
  IF EXISTS (SELECT 1 FROM public.school_year WHERE branch_id = dst_branch)
     OR EXISTS (SELECT 1 FROM public.standard WHERE branch_id = dst_branch) THEN
    RAISE NOTICE 'Viman Nagar already has data; skipping seed.';
    RETURN;
  END IF;

  -- Old-id -> new-id maps, soft-deleted rows excluded at the source.
  CREATE TEMP TABLE sy_map AS
    SELECT id AS old_id, gen_random_uuid() AS new_id
    FROM public.school_year WHERE branch_id = src_branch;

  CREATE TEMP TABLE std_map AS
    SELECT id AS old_id, gen_random_uuid() AS new_id
    FROM public.standard WHERE branch_id = src_branch AND deleted_at IS NULL;

  CREATE TEMP TABLE seg_map AS
    SELECT id AS old_id, gen_random_uuid() AS new_id
    FROM public.academic_segment WHERE branch_id = src_branch AND deleted_at IS NULL;

  CREATE TEMP TABLE sub_map AS
    SELECT id AS old_id, gen_random_uuid() AS new_id
    FROM public.subject
    WHERE deleted_at IS NULL AND standard_id IN (SELECT old_id FROM std_map);

  INSERT INTO public.school_year (id, name, start_date, end_date, is_active, branch_id)
  SELECT m.new_id, s.name, s.start_date, s.end_date, s.is_active, dst_branch
  FROM public.school_year s JOIN sy_map m ON m.old_id = s.id;

  INSERT INTO public.standard (id, name, grade, branch_id)
  SELECT m.new_id, s.name, s.grade, dst_branch
  FROM public.standard s JOIN std_map m ON m.old_id = s.id;

  INSERT INTO public.academic_segment
    (id, school_year_id, standard_id, name, segment_type, sequence_number, start_date, end_date, branch_id)
  SELECT m.new_id, sym.new_id, stdm.new_id, s.name, s.segment_type, s.sequence_number, s.start_date, s.end_date, dst_branch
  FROM public.academic_segment s
  JOIN seg_map m ON m.old_id = s.id
  JOIN sy_map sym ON sym.old_id = s.school_year_id
  JOIN std_map stdm ON stdm.old_id = s.standard_id;

  INSERT INTO public.subject (id, standard_id, name, type, periods_per_week, has_chapters)
  SELECT m.new_id, stdm.new_id, s.name, s.type, s.periods_per_week, s.has_chapters
  FROM public.subject s
  JOIN sub_map m ON m.old_id = s.id
  JOIN std_map stdm ON stdm.old_id = s.standard_id;

  INSERT INTO public.chapter
    (subject_id, academic_segment_id, chapter_number, name, allocated_periods,
     effective_periods, comments, display_order, status, total_periods_done)
  SELECT subm.new_id, segm.new_id, c.chapter_number, c.name, c.allocated_periods,
         c.effective_periods, c.comments, c.display_order, 'not_started', 0
  FROM public.chapter c
  JOIN sub_map subm ON subm.old_id = c.subject_id
  JOIN seg_map segm ON segm.old_id = c.academic_segment_id
  WHERE c.deleted_at IS NULL;

  DROP TABLE sy_map;
  DROP TABLE std_map;
  DROP TABLE seg_map;
  DROP TABLE sub_map;
END $$;
