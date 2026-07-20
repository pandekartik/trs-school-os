-- Close the branch_id gap on period_instance and audit_log flagged in the
-- 2026-07-13 audit: every other operational table got branch_id in
-- 021_branch_scoping.sql, these two were missed.
--
-- period_instance is backfillable (derive from timetable_slot.branch_id,
-- which is already branch-scoped). audit_log has no branch signal on
-- historical rows, so those stay NULL -- new rows get stamped going
-- forward via lib/audit.ts.

ALTER TABLE public.period_instance ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branch(id);
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branch(id);

CREATE INDEX IF NOT EXISTS idx_period_instance_branch ON public.period_instance(branch_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_branch ON public.audit_log(branch_id);

UPDATE public.period_instance pi
SET branch_id = ts.branch_id
FROM public.timetable_slot ts
WHERE pi.timetable_slot_id = ts.id
  AND pi.branch_id IS NULL
  AND ts.branch_id IS NOT NULL;
