-- Migration: Add Password Reset Fields
-- Run this migration to add password reset functionality

-- Add password reset fields to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;

-- Add comments
COMMENT ON COLUMN users.reset_token IS 'Password reset token';
COMMENT ON COLUMN users.reset_token_expires_at IS 'When the reset token expires';

