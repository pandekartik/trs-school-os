ALTER TABLE teacher DROP CONSTRAINT IF EXISTS teacher_role_check;

UPDATE teacher
SET role = 'teacher'
WHERE role = 'hod';

ALTER TABLE teacher
ADD CONSTRAINT teacher_role_check CHECK (role IN ('admin', 'coordinator', 'teacher'));
