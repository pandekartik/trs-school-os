-- Fix foreign key constraint to allow deletion of time templates
ALTER TABLE division_template 
DROP CONSTRAINT division_template_template_id_fkey;

ALTER TABLE division_template 
ADD CONSTRAINT division_template_template_id_fkey 
  FOREIGN KEY (template_id) REFERENCES time_template(id) ON DELETE CASCADE;
