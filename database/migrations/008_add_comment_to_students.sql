-- Add comment field to students table
-- This allows storing optional comments when updating student records via PATCH

ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS medium TEXT;

-- Add index for comment search (optional, only if you need to search by comments)
-- CREATE INDEX IF NOT EXISTS idx_students_comment ON students USING gin(to_tsvector('english', COALESCE(comment, '')));

-- Add comment
COMMENT ON COLUMN students.medium IS 'MARATHI';


