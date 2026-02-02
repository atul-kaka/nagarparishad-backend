-- Migration: Align Database with Backup Schema
-- This migration ensures all tables match the structure in schema_backup.sql
-- Run this to add any missing columns, indexes, or constraints

-- ============================================================================
-- USERS TABLE - Add missing columns
-- ============================================================================

-- Add reset_token columns if they don't exist (from migration 004)
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP;

-- Create index for reset_token if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;

-- Add comments for reset_token columns
COMMENT ON COLUMN users.reset_token IS 'Password reset token';
COMMENT ON COLUMN users.reset_token_expires_at IS 'When the reset token expires';

-- ============================================================================
-- STUDENTS TABLE - Handle general_register_ref column
-- ============================================================================

-- Note: The backup schema has 'general_register_ref' but we renamed it to 'school_general_register_no'
-- If school_general_register_no exists, we'll keep it (it's the same field, just renamed)
-- If general_register_ref exists in backup, we need to ensure compatibility

-- Check if we need to add general_register_ref (if school_general_register_no doesn't exist)
-- This is handled by the application code which maps between the two names

-- Ensure the column exists with one of the names
DO $$
BEGIN
    -- If school_general_register_no exists, we're good
    -- If only general_register_ref exists, that's also fine
    -- The application code handles the mapping
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' 
        AND (column_name = 'school_general_register_no' OR column_name = 'general_register_ref')
    ) THEN
        -- Add general_register_ref if neither exists
        ALTER TABLE students ADD COLUMN general_register_ref VARCHAR(100);
    END IF;
END $$;

-- ============================================================================
-- ENSURE ALL INDEXES FROM BACKUP EXIST
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;

-- Students indexes
CREATE INDEX IF NOT EXISTS idx_students_uid_aadhar ON students(uid_aadhar_no);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_serial_no ON students(serial_no);
CREATE INDEX IF NOT EXISTS idx_students_school_serial ON students(school_id, serial_no) 
    WHERE school_id IS NOT NULL AND serial_no IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_qr_code_hash ON students(qr_code_hash) 
    WHERE qr_code_hash IS NOT NULL;

-- Schools indexes
CREATE INDEX IF NOT EXISTS idx_schools_status ON schools(status);
CREATE INDEX IF NOT EXISTS idx_schools_recognition_no ON schools(school_recognition_no);
CREATE INDEX IF NOT EXISTS idx_schools_udise_no ON schools(udise_no);
CREATE INDEX IF NOT EXISTS idx_schools_general_register_no ON schools(general_register_no);

-- Leaving certificates indexes
CREATE INDEX IF NOT EXISTS idx_leaving_certificates_school_id ON leaving_certificates(school_id);
CREATE INDEX IF NOT EXISTS idx_leaving_certificates_student_id ON leaving_certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_leaving_certificates_serial_no ON leaving_certificates(serial_no);
CREATE INDEX IF NOT EXISTS idx_leaving_certificates_status ON leaving_certificates(status);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON audit_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs(changed_at);

-- Certificate status history indexes
CREATE INDEX IF NOT EXISTS idx_certificate_status_history_cert_id ON certificate_status_history(certificate_id);

-- Login sessions indexes
CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id ON login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_login_sessions_token ON login_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_login_sessions_active ON login_sessions(is_active) WHERE is_active = true;

-- Record visits indexes
CREATE INDEX IF NOT EXISTS idx_record_visits_user_id ON record_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_record_visits_record ON record_visits(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_record_visits_visited_at ON record_visits(visited_at);

-- ============================================================================
-- ENSURE ALL CONSTRAINTS MATCH BACKUP
-- ============================================================================

-- Users role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('user', 'admin', 'super'));

-- Leaving certificates status constraint
ALTER TABLE leaving_certificates DROP CONSTRAINT IF EXISTS leaving_certificates_status_check;
ALTER TABLE leaving_certificates ADD CONSTRAINT leaving_certificates_status_check 
    CHECK (status IN ('new', 'in_review', 'rejected', 'accepted', 'draft', 'issued', 'archived', 'cancelled'));

-- ============================================================================
-- ENSURE UNIQUE CONSTRAINTS
-- ============================================================================

-- Students unique constraints
DO $$
BEGIN
    -- student_id unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'students_student_id_key'
    ) THEN
        ALTER TABLE students ADD CONSTRAINT students_student_id_key UNIQUE (student_id);
    END IF;
    
    -- uid_aadhar_no unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'students_uid_aadhar_no_key'
    ) THEN
        ALTER TABLE students ADD CONSTRAINT students_uid_aadhar_no_key UNIQUE (uid_aadhar_no);
    END IF;
    
    -- qr_code_hash unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'students_qr_code_hash_key'
    ) THEN
        ALTER TABLE students ADD CONSTRAINT students_qr_code_hash_key UNIQUE (qr_code_hash);
    END IF;
END $$;

-- Leaving certificates unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'leaving_certificates_school_id_serial_no_key'
    ) THEN
        ALTER TABLE leaving_certificates 
        ADD CONSTRAINT leaving_certificates_school_id_serial_no_key UNIQUE (school_id, serial_no);
    END IF;
END $$;

-- Login sessions unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'login_sessions_session_token_key'
    ) THEN
        ALTER TABLE login_sessions 
        ADD CONSTRAINT login_sessions_session_token_key UNIQUE (session_token);
    END IF;
END $$;

-- ============================================================================
-- VERIFY STRUCTURE
-- ============================================================================

-- Display summary of changes
DO $$
DECLARE
    reset_token_exists BOOLEAN;
    reset_token_expires_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'reset_token'
    ) INTO reset_token_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'reset_token_expires_at'
    ) INTO reset_token_expires_exists;
    
    RAISE NOTICE 'Migration completed. Reset token columns: %', 
        CASE WHEN reset_token_exists AND reset_token_expires_exists THEN 'Added' ELSE 'Already exists' END;
END $$;

