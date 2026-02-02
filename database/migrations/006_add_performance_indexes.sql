-- Performance Optimization Indexes for 200K+ Records
-- Run this migration to add critical indexes for better query performance

-- Students table indexes
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_uid_aadhar ON students(uid_aadhar_no);
CREATE INDEX IF NOT EXISTS idx_students_serial_no ON students(serial_no);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_students_updated_at ON students(updated_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_students_status_school ON students(status, school_id);
CREATE INDEX IF NOT EXISTS idx_students_status_created ON students(status, created_at DESC);

-- Full-text search index (for name searches)
-- First, add search vector column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute 
        WHERE attrelid = 'students'::regclass 
        AND attname = 'search_vector'
    ) THEN
        ALTER TABLE students ADD COLUMN search_vector tsvector;
    END IF;
END $$;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_students_search_vector ON students USING gin(search_vector);

-- Update search vector for existing records
UPDATE students SET search_vector = 
  to_tsvector('english', 
    COALESCE(full_name, '') || ' ' || 
    COALESCE(student_id, '') || ' ' || 
    COALESCE(uid_aadhar_no, '') || ' ' ||
    COALESCE(serial_no, '')
  )
WHERE search_vector IS NULL;

-- Create trigger to auto-update search vector on insert/update
CREATE OR REPLACE FUNCTION update_student_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    to_tsvector('english', 
      COALESCE(NEW.full_name, '') || ' ' || 
      COALESCE(NEW.student_id, '') || ' ' || 
      COALESCE(NEW.uid_aadhar_no, '') || ' ' ||
      COALESCE(NEW.serial_no, '')
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_student_search_vector ON students;
CREATE TRIGGER trigger_update_student_search_vector
  BEFORE INSERT OR UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_student_search_vector();

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_by ON audit_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_table_action ON audit_logs(table_name, action);

-- Composite index for common audit queries
CREATE INDEX IF NOT EXISTS idx_audit_table_record_date ON audit_logs(table_name, record_id, created_at DESC);

-- Schools table indexes (if not already exist)
CREATE INDEX IF NOT EXISTS idx_schools_recognition_no ON schools(school_recognition_no);
CREATE INDEX IF NOT EXISTS idx_schools_udise_no ON schools(udise_no);
CREATE INDEX IF NOT EXISTS idx_schools_name ON schools(name);

-- Certificate status history indexes
CREATE INDEX IF NOT EXISTS idx_cert_status_history_cert_id ON certificate_status_history(certificate_id);
CREATE INDEX IF NOT EXISTS idx_cert_status_history_changed_at ON certificate_status_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cert_status_history_status ON certificate_status_history(new_status);

-- Record visits indexes
CREATE INDEX IF NOT EXISTS idx_record_visits_record ON record_visits(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_record_visits_user ON record_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_record_visits_visited_at ON record_visits(visited_at DESC);

-- Analyze tables to update statistics
ANALYZE students;
ANALYZE audit_logs;
ANALYZE schools;
ANALYZE certificate_status_history;
ANALYZE record_visits;

-- Comments
COMMENT ON INDEX idx_students_status IS 'Index for filtering by certificate status (critical for public access)';
COMMENT ON INDEX idx_students_search_vector IS 'Full-text search index for name/ID searches';
COMMENT ON INDEX idx_audit_table_record_date IS 'Composite index for audit log queries by table and date';




