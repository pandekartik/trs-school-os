-- Backfill display_id for existing period_instance records
-- Format: {grade}{division}-{dayInitial}-P{periodOrder}-{MMDD}

UPDATE public.period_instance pi
SET display_id = CONCAT(
  s.grade::text,
  d.name,
  '-',
  CASE
    WHEN LOWER(ts.day_of_week) = 'monday' THEN 'M'
    WHEN LOWER(ts.day_of_week) = 'tuesday' THEN 'T'
    WHEN LOWER(ts.day_of_week) = 'wednesday' THEN 'W'
    WHEN LOWER(ts.day_of_week) = 'thursday' THEN 'H'
    WHEN LOWER(ts.day_of_week) = 'friday' THEN 'F'
    WHEN LOWER(ts.day_of_week) = 'saturday' THEN 'S'
    ELSE SUBSTRING(ts.day_of_week, 1, 1)
  END,
  '-P',
  LPAD(tmps.display_order::text, 2, '0'),
  '-',
  TO_CHAR(pi.date, 'MMDD')
)
FROM public.timetable_slot ts
JOIN public.template_slot tmps ON ts.template_slot_id = tmps.id
JOIN public.division d ON ts.division_id = d.id
JOIN public.standard s ON d.standard_id = s.id
WHERE pi.timetable_slot_id = ts.id
AND pi.display_id IS NULL;

-- Backfill display_id for timetable_slot records
UPDATE public.timetable_slot ts
SET display_id = CONCAT(
  s.grade::text,
  d.name,
  '-',
  CASE
    WHEN LOWER(ts.day_of_week) = 'monday' THEN 'M'
    WHEN LOWER(ts.day_of_week) = 'tuesday' THEN 'T'
    WHEN LOWER(ts.day_of_week) = 'wednesday' THEN 'W'
    WHEN LOWER(ts.day_of_week) = 'thursday' THEN 'H'
    WHEN LOWER(ts.day_of_week) = 'friday' THEN 'F'
    WHEN LOWER(ts.day_of_week) = 'saturday' THEN 'S'
    ELSE SUBSTRING(ts.day_of_week, 1, 1)
  END,
  '-P',
  LPAD(tmps.display_order::text, 2, '0')
)
FROM public.template_slot tmps
JOIN public.division d ON ts.division_id = d.id
JOIN public.standard s ON d.standard_id = s.id
WHERE ts.template_slot_id = tmps.id
AND ts.display_id IS NULL;
