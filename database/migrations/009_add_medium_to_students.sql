-- Add medium column to students table
-- Medium options: Marathi, Hindi, English, etc.

ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS medium VARCHAR(100);

-- Set default value for existing records (optional - can be NULL)
-- UPDATE students SET medium = 'Marathi' WHERE medium IS NULL;

-- Add comment
COMMENT ON COLUMN students.medium IS 'Medium of instruction for the student certificate (Marathi, Hindi, English, etc.)';



