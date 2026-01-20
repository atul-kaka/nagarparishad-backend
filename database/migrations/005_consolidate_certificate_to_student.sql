-- Migration: Consolidate Certificate Data into Students Table
-- This migration adds all certificate-related fields to the students table
-- and allows students to be directly associated with schools

-- Add school reference and certificate fields to students table
ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS serial_no VARCHAR(50),
  ADD COLUMN IF NOT EXISTS previous_school VARCHAR(500),
  ADD COLUMN IF NOT EXISTS previous_class VARCHAR(50),
  ADD COLUMN IF NOT EXISTS admission_date DATE,
  ADD COLUMN IF NOT EXISTS admission_class VARCHAR(50),
  ADD COLUMN IF NOT EXISTS progress_in_studies VARCHAR(255),
  ADD COLUMN IF NOT EXISTS conduct VARCHAR(255),
  ADD COLUMN IF NOT EXISTS leaving_date DATE,
  ADD COLUMN IF NOT EXISTS leaving_class VARCHAR(50),
  ADD COLUMN IF NOT EXISTS studying_class_and_since TEXT,
  ADD COLUMN IF NOT EXISTS reason_for_leaving TEXT,
  ADD COLUMN IF NOT EXISTS remarks TEXT,
  ADD COLUMN IF NOT EXISTS general_register_ref VARCHAR(100),
  ADD COLUMN IF NOT EXISTS certificate_date DATE,
  ADD COLUMN IF NOT EXISTS certificate_month VARCHAR(50),
  ADD COLUMN IF NOT EXISTS certificate_year INTEGER,
  ADD COLUMN IF NOT EXISTS class_teacher_signature VARCHAR(255),
  ADD COLUMN IF NOT EXISTS clerk_signature VARCHAR(255),
  ADD COLUMN IF NOT EXISTS headmaster_signature VARCHAR(255),
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add unique constraint for school_id + serial_no combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_school_serial 
  ON students(school_id, serial_no) 
  WHERE school_id IS NOT NULL AND serial_no IS NOT NULL;

-- Add index for school_id
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);

-- Add index for status
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- Add index for serial_no
CREATE INDEX IF NOT EXISTS idx_students_serial_no ON students(serial_no);

-- Add comments
COMMENT ON COLUMN students.school_id IS 'Reference to the school issuing the certificate';
COMMENT ON COLUMN students.serial_no IS 'Serial number of the leaving certificate';
COMMENT ON COLUMN students.status IS 'Certificate status: new, in_review, rejected, accepted, draft, issued, archived, cancelled';

