-- Add entity_label column to audit_log for UI display
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS entity_label varchar;
