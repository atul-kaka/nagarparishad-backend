-- Enhanced Database Schema with Audit Trail for Nagar Parishad School Leaving Certificate System

-- Users Table (for registration and authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(500) NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- user, admin, clerk, headmaster
    phone_no VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schools Table (with audit fields)
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
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students Table (with audit fields)
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE,
    uid_aadhar_no VARCHAR(12) UNIQUE,
    full_name VARCHAR(500) NOT NULL,
    father_name VARCHAR(500),
    mother_name VARCHAR(500),
    surname VARCHAR(255),
    nationality VARCHAR(100),
    mother_tongue VARCHAR(100),
    religion VARCHAR(100),
    caste VARCHAR(100),
    sub_caste VARCHAR(100),
    birth_place_village VARCHAR(255),
    birth_place_taluka VARCHAR(255),
    birth_place_district VARCHAR(255),
    birth_place_state VARCHAR(255),
    birth_place_country VARCHAR(100) DEFAULT 'India',
    date_of_birth DATE NOT NULL,
    date_of_birth_words VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, archived
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leaving Certificates Table (with audit fields)
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
    -- Signature fields (storing names/status)
    class_teacher_name VARCHAR(255),
    clerk_name VARCHAR(255),
    headmaster_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft', -- draft, issued, archived, cancelled
    -- Audit fields
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    issued_by INTEGER REFERENCES users(id), -- Who issued the certificate
    issued_at TIMESTAMP, -- When certificate was issued
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, serial_no)
);

-- Audit Log Table (for tracking all changes)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL, -- schools, students, leaving_certificates
    record_id INTEGER NOT NULL, -- ID of the record that was changed
    action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
    field_name VARCHAR(100), -- Name of the field that changed (for UPDATE)
    old_value TEXT, -- Previous value
    new_value TEXT, -- New value
    changed_by INTEGER REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45), -- IPv4 or IPv6
    user_agent TEXT, -- Browser/client information
    notes TEXT -- Additional notes about the change
);

-- Certificate Status History Table (track status changes)
CREATE TABLE IF NOT EXISTS certificate_status_history (
    id SERIAL PRIMARY KEY,
    certificate_id INTEGER NOT NULL REFERENCES leaving_certificates(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INTEGER REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT, -- Reason for status change
    notes TEXT
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leaving_certificates_school_id ON leaving_certificates(school_id);
CREATE INDEX IF NOT EXISTS idx_leaving_certificates_student_id ON leaving_certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_leaving_certificates_serial_no ON leaving_certificates(serial_no);
CREATE INDEX IF NOT EXISTS idx_leaving_certificates_status ON leaving_certificates(status);
CREATE INDEX IF NOT EXISTS idx_students_uid_aadhar ON students(uid_aadhar_no);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON audit_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs(changed_at);
CREATE INDEX IF NOT EXISTS idx_certificate_status_history_cert_id ON certificate_status_history(certificate_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_schools_status ON schools(status);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

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

-- Function to log changes to audit_logs
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_value, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW)::text, NEW.created_by);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (table_name, record_id, action, field_name, old_value, new_value, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', 'record', row_to_json(OLD)::text, row_to_json(NEW)::text, NEW.updated_by);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_value, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::text, OLD.updated_by);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Triggers for audit logging (optional - can be enabled/disabled)
-- Uncomment these if you want automatic audit logging for all changes
-- CREATE TRIGGER audit_schools_changes AFTER INSERT OR UPDATE OR DELETE ON schools
--     FOR EACH ROW EXECUTE FUNCTION log_audit_changes();
-- 
-- CREATE TRIGGER audit_students_changes AFTER INSERT OR UPDATE OR DELETE ON students
--     FOR EACH ROW EXECUTE FUNCTION log_audit_changes();
-- 
-- CREATE TRIGGER audit_certificates_changes AFTER INSERT OR UPDATE OR DELETE ON leaving_certificates
--     FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

