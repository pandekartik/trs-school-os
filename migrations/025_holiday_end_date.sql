-- Support multi-day holidays (e.g. Diwali spanning 10 days) by adding an
-- end_date alongside the existing start date. Existing rows are single-day,
-- so backfill end_date to match date before enforcing NOT NULL.
ALTER TABLE public.holiday ADD COLUMN end_date date;

UPDATE public.holiday SET end_date = date WHERE end_date IS NULL;

ALTER TABLE public.holiday ALTER COLUMN end_date SET NOT NULL;

ALTER TABLE public.holiday
  ADD CONSTRAINT holiday_end_date_check CHECK (end_date >= date);
