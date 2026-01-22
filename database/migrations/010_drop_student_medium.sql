-- Drop medium column from students table
ALTER TABLE students
  DROP COLUMN IF EXISTS medium;

-- Note: medium remains on schools table for school-level medium


