-- Migration: Add RBAC, Authentication, and Enhanced Audit
-- Run this migration to add role-based access control, authentication, and enhanced audit features

-- Update users table with authentication fields
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP,
  ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6),
  ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_ip_address VARCHAR(45),
  ADD COLUMN IF NOT EXISTS last_user_agent TEXT;

-- Update role constraint to match new roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'super'));

-- Update leaving_certificates status to include new statuses
ALTER TABLE leaving_certificates DROP CONSTRAINT IF EXISTS leaving_certificates_status_check;
ALTER TABLE leaving_certificates ADD CONSTRAINT leaving_certificates_status_check 
  CHECK (status IN ('new', 'in_review', 'rejected', 'accepted', 'draft', 'issued', 'archived', 'cancelled'));

-- Create login_sessions table for tracking active sessions
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

CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id ON login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_login_sessions_token ON login_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_login_sessions_active ON login_sessions(is_active) WHERE is_active = true;

-- Enhanced audit_logs with location tracking
ALTER TABLE audit_logs 
  ADD COLUMN IF NOT EXISTS location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS action_type VARCHAR(50); -- 'view', 'add', 'update', 'delete', 'login', 'logout'

-- Create record_visits table for tracking document views
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

CREATE INDEX IF NOT EXISTS idx_record_visits_user_id ON record_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_record_visits_record ON record_visits(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_record_visits_visited_at ON record_visits(visited_at);

-- Create function to update last_activity in login_sessions
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE login_sessions 
    SET last_activity = CURRENT_TIMESTAMP 
    WHERE session_token = NEW.session_token AND is_active = true;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic session activity updates (if needed)
-- This can be called manually from the application

-- Add comments for documentation
COMMENT ON COLUMN users.password_expires_at IS 'When the password expires (null = never expires)';
COMMENT ON COLUMN users.otp_code IS 'OTP code for mobile authentication';
COMMENT ON COLUMN users.otp_expires_at IS 'When the OTP expires';
COMMENT ON COLUMN leaving_certificates.status IS 'Status: new, in_review, rejected, accepted, draft, issued, archived, cancelled';
COMMENT ON COLUMN audit_logs.action_type IS 'Type of action: view, add, update, delete, login, logout';
COMMENT ON COLUMN record_visits.table_name IS 'Table name of the visited record';
COMMENT ON COLUMN record_visits.mobile_number IS 'Mobile number of the user who visited';



