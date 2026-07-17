-- markAttendance/bulkMarkAttendance (lib/actions/teacher.ts) write marked_at,
-- but the column was never created — every attendance mark was failing with
-- "Could not find the 'marked_at' column of 'teacher_attendance' in the
-- schema cache". teacher_absence already has this column; teacher_attendance
-- should match it.

ALTER TABLE public.teacher_attendance
ADD COLUMN IF NOT EXISTS marked_at timestamptz DEFAULT now();
