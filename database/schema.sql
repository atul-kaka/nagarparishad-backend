-- Database Schema for Nagar Parishad School Leaving Certificate System

-- Schools Table
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students Table
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leaving Certificates Table
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
    status VARCHAR(50) DEFAULT 'draft', -- draft, issued, archived
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, serial_no)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leaving_certificates_school_id ON leaving_certificates(school_id);
CREATE INDEX IF NOT EXISTS idx_leaving_certificates_student_id ON leaving_certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_leaving_certificates_serial_no ON leaving_certificates(serial_no);
CREATE INDEX IF NOT EXISTS idx_students_uid_aadhar ON students(uid_aadhar_no);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);

