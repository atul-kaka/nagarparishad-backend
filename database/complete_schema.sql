-- Complete Database Schema for Nagar Parishad School Leaving Certificate System
-- This file contains all tables, migrations, and indexes in the correct order
-- Run this file to set up a fresh database on a new server
--
-- Usage: psql -U postgres -d nagarparishad_db -f complete_schema.sql
--
-- Make sure to create the database first:
-- CREATE DATABASE nagarparishad_db WITH ENCODING 'UTF8';

-- ============================================================================
-- USERS TABLE (for authentication and RBAC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(500) NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- user, admin, clerk, headmaster, super_admin, super
    phone_no VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    -- Authentication fields (from migration 003)
    password_expires_at TIMESTAMP,
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP,
    otp_verified BOOLEAN DEFAULT false,
    last_ip_address VARCHAR(45),
    last_user_agent TEXT,
    -- Password reset fields (from migration 004)
    reset_token VARCHAR(255),
    reset_token_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SCHOOLS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    address TEXT,
    taluka VARCHAR(255),
    district VARCHAR(255),
    state VARCHAR(255),
    phone_no VARCHAR(50),
    email VARCHAR(255),
    general_register_no VARCHAR(100),
    school_recognition_no VARCHAR(100),
    udise_no VARCHAR(100),
    affiliation_no VARCHAR(100),
    board VARCHAR(255) DEFAULT 'Maharashtra State',
    medium VARCHAR(100) DEFAULT 'Marathi',
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, archived
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STUDENTS TABLE (with all certificate fields consolidated)
-- ============================================================================
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE,
    uid_aadhar_no VARCHAR(12) UNIQUE,
    
    -- Basic student information
    full_name VARCHAR(500) NOT NULL,
    father_name VARCHAR(500),
    mother_name VARCHAR(500),
    surname VARCHAR(255),
    nationality VARCHAR(100),
    mother_tongue VARCHAR(100),
    religion VARCHAR(100),
    caste VARCHAR(100),
    sub_caste VARCHAR(100),
    
    -- Birth place information
    birth_place_village VARCHAR(255),
    birth_place_taluka VARCHAR(255),
    birth_place_district VARCHAR(255),
    birth_place_state VARCHAR(255),
    birth_place_country VARCHAR(100) DEFAULT 'India',
    date_of_birth DATE NOT NULL,
    date_of_birth_words VARCHAR(500),
    
    -- School reference
    school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
    serial_no VARCHAR(50),
    
    -- Certificate fields (consolidated from leaving_certificates)
    previous_school VARCHAR(500),
    previous_class VARCHAR(50),
    admission_date DATE,
    admission_class VARCHAR(50),
    progress_in_studies VARCHAR(255),
    conduct VARCHAR(255),
    leaving_date DATE,
    leaving_class VARCHAR(50),
    studying_class_and_since TEXT,
    reason_for_leaving TEXT,
    remarks TEXT,
    school_general_register_no VARCHAR(100), -- Renamed from general_register_ref
    certificate_date DATE,
    certificate_month VARCHAR(50),
    certificate_year INTEGER,
    class_teacher_signature VARCHAR(255),
    clerk_signature VARCHAR(255),
    headmaster_signature VARCHAR(255),
    
    -- Status and audit fields
    status VARCHAR(50) DEFAULT 'draft', -- draft, new, in_review, rejected, accepted, issued, archived, cancelled
    comment TEXT, -- Added in migration 008
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- QR Code hash for public viewing (migration 011)
    qr_code_hash VARCHAR(64) UNIQUE
);

-- ============================================================================
-- LEAVING CERTIFICATES TABLE (kept for backward compatibility)
-- ============================================================================
CREATE TABLE IF NOT EXISTS leaving_certificates (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    serial_no VARCHAR(50) NOT NULL,
    previous_school VARCHAR(500),
    previous_class VARCHAR(50),
    admission_date DATE,
    admission_class VARCHAR(50),
    progress_in_studies VARCHAR(255),
    conduct VARCHAR(255),
    leaving_date DATE NOT NULL,
    leaving_class VARCHAR(50) NOT NULL,
    studying_class_and_since TEXT,
    reason_for_leaving TEXT,
    remarks TEXT,
    general_register_ref VARCHAR(100),
    certificate_date DATE,
    certificate_month VARCHAR(50),
    certificate_year INTEGER,
    class_teacher_name VARCHAR(255),
    clerk_name VARCHAR(255),
    headmaster_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    issued_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    issued_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, serial_no)
);

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    notes TEXT,
    -- Enhanced audit fields (from migration 003)
    location VARCHAR(255),
    action_type VARCHAR(50) -- 'view', 'add', 'update', 'delete', 'login', 'logout'
);

-- ============================================================================
-- CERTIFICATE STATUS HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS certificate_status_history (
    id SERIAL PRIMARY KEY,
    certificate_id INTEGER NOT NULL REFERENCES leaving_certificates(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    notes TEXT
);

-- ============================================================================
-- PASSWORD RESET TOKENS TABLE (migration 004)
-- ============================================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LOGIN SESSIONS TABLE (migration 003)
-- ============================================================================
CREATE TABLE IF NOT EXISTS login_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    location VARCHAR(255), -- Can store city/region if available
    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- ============================================================================
-- RECORD VISITS TABLE (migration 003)
-- ============================================================================
CREATE TABLE IF NOT EXISTS record_visits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    table_name VARCHAR(100) NOT NULL, -- 'schools', 'students', 'leaving_certificates'
    record_id INTEGER NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    location VARCHAR(255),
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mobile_number VARCHAR(50) -- User's mobile number
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;

-- Schools indexes
CREATE INDEX IF NOT EXISTS idx_schools_status ON schools(status);
CREATE INDEX IF NOT EXISTS idx_schools_recognition_no ON schools(school_recognition_no);
CREATE INDEX IF NOT EXISTS idx_schools_udise_no ON schools(udise_no);
CREATE INDEX IF NOT EXISTS idx_schools_general_register_no ON schools(general_register_no);

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

-- Password reset tokens indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Login sessions indexes (migration 003)
CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id ON login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_login_sessions_token ON login_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_login_sessions_active ON login_sessions(is_active) WHERE is_active = true;

-- Record visits indexes (migration 003)
CREATE INDEX IF NOT EXISTS idx_record_visits_user_id ON record_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_record_visits_record ON record_visits(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_record_visits_visited_at ON record_visits(visited_at);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaving_certificates_updated_at BEFORE UPDATE ON leaving_certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE students IS 'Students table with consolidated certificate data';
COMMENT ON COLUMN students.school_id IS 'Reference to the school issuing the certificate';
COMMENT ON COLUMN students.serial_no IS 'Serial number of the leaving certificate';
COMMENT ON COLUMN students.status IS 'Certificate status: draft, new, in_review, rejected, accepted, issued, archived, cancelled';
COMMENT ON COLUMN students.school_general_register_no IS 'References the general register number of the associated school';
COMMENT ON COLUMN students.qr_code_hash IS 'SHA256 hash for public QR code viewing';

-- User authentication fields (migration 003)
COMMENT ON COLUMN users.password_expires_at IS 'When the password expires (null = never expires)';
COMMENT ON COLUMN users.otp_code IS 'OTP code for mobile authentication';
COMMENT ON COLUMN users.otp_expires_at IS 'When the OTP expires';
COMMENT ON COLUMN users.last_ip_address IS 'Last IP address from which user logged in';
COMMENT ON COLUMN users.last_user_agent IS 'Last user agent from which user logged in';
COMMENT ON COLUMN users.reset_token IS 'Password reset token';
COMMENT ON COLUMN users.reset_token_expires_at IS 'When the reset token expires';

-- Audit logs enhanced fields (migration 003)
COMMENT ON COLUMN audit_logs.action_type IS 'Type of action: view, add, update, delete, login, logout';
COMMENT ON COLUMN audit_logs.location IS 'Location of the action (city/region if available)';

-- Record visits (migration 003)
COMMENT ON COLUMN record_visits.table_name IS 'Table name of the visited record';
COMMENT ON COLUMN record_visits.mobile_number IS 'Mobile number of the user who visited';

-- ============================================================================
-- VERIFICATION QUERIES (uncomment to run after setup)
-- ============================================================================
-- SELECT 'Tables created:' as info;
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' ORDER BY table_name;
-- 
-- SELECT 'Indexes created:' as info;
-- SELECT indexname FROM pg_indexes 
-- WHERE schemaname = 'public' ORDER BY indexname;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

