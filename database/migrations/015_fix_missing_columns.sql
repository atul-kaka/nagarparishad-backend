-- Migration: Fix Missing Columns for Authentication
-- This migration adds missing columns that are referenced in the code but may not exist in the database
-- Run this if you're getting errors about missing columns: last_ip_address, action_type, login_sessions

-- Add missing columns to users table (if not already added by migration 003)
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

-- Add missing columns to audit_logs table (if not already added by migration 003)
ALTER TABLE audit_logs 
  ADD COLUMN IF NOT EXISTS location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS action_type VARCHAR(50); -- 'view', 'add', 'update', 'delete', 'login', 'logout'

-- Create login_sessions table if it doesn't exist (from migration 003)
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

-- Create record_visits table if it doesn't exist (from migration 003)
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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id ON login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_login_sessions_token ON login_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_login_sessions_active ON login_sessions(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_record_visits_user_id ON record_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_record_visits_record ON record_visits(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_record_visits_visited_at ON record_visits(visited_at);

-- Update role constraint to match new roles (if needed)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'super'));

-- Add comments for documentation
COMMENT ON COLUMN users.password_expires_at IS 'When the password expires (null = never expires)';
COMMENT ON COLUMN users.otp_code IS 'OTP code for mobile authentication';
COMMENT ON COLUMN users.otp_expires_at IS 'When the OTP expires';
COMMENT ON COLUMN users.last_ip_address IS 'Last IP address from which user logged in';
COMMENT ON COLUMN users.last_user_agent IS 'Last user agent from which user logged in';
COMMENT ON COLUMN audit_logs.action_type IS 'Type of action: view, add, update, delete, login, logout';
COMMENT ON COLUMN audit_logs.location IS 'Location of the action (city/region if available)';
COMMENT ON COLUMN record_visits.table_name IS 'Table name of the visited record';
COMMENT ON COLUMN record_visits.mobile_number IS 'Mobile number of the user who visited';

