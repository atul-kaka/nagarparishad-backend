-- Migration: Add QR Code Hash for Public Student Viewing
-- This allows students to be viewed publicly via QR code without authentication

-- Add QR code hash column to students table
ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS qr_code_hash VARCHAR(64) UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_students_qr_code_hash ON students(qr_code_hash) WHERE qr_code_hash IS NOT NULL;

-- Add comment
COMMENT ON COLUMN students.qr_code_hash IS '64-character SHA-256 hash for public QR code access. Generated from student ID and timestamp.';

