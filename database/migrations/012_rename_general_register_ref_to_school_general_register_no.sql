-- Migration: Rename general_register_ref to school_general_register_no
-- This field should reference the school's general_register_no, so naming should be consistent

-- Rename the column
ALTER TABLE students 
  RENAME COLUMN general_register_ref TO school_general_register_no;

-- Add comment
COMMENT ON COLUMN students.school_general_register_no IS 'Reference to the school''s general register number (from schools.general_register_no)';

