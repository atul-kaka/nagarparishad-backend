-- Add unique constraints to prevent duplicate school records
-- At least ONE of these fields must be provided and unique: school_recognition_no, general_register_no, affiliation_no
-- Each field, when provided, must be unique across all schools

-- First, check for existing duplicates and warn (optional - comment out if you want to fail on duplicates)
-- DO $$
-- DECLARE
--   duplicate_count INTEGER;
-- BEGIN
--   -- Check for duplicate school_recognition_no (excluding NULL)
--   SELECT COUNT(*) INTO duplicate_count
--   FROM (
--     SELECT school_recognition_no, COUNT(*) as cnt
--     FROM schools
--     WHERE school_recognition_no IS NOT NULL
--     GROUP BY school_recognition_no
--     HAVING COUNT(*) > 1
--   ) duplicates;
--   
--   IF duplicate_count > 0 THEN
--     RAISE WARNING 'Found % duplicate school_recognition_no values. Please resolve before adding unique constraint.', duplicate_count;
--   END IF;
--   
--   -- Similar checks for general_register_no and affiliation_no
--   SELECT COUNT(*) INTO duplicate_count
--   FROM (
--     SELECT general_register_no, COUNT(*) as cnt
--     FROM schools
--     WHERE general_register_no IS NOT NULL
--     GROUP BY general_register_no
--     HAVING COUNT(*) > 1
--   ) duplicates;
--   
--   IF duplicate_count > 0 THEN
--     RAISE WARNING 'Found % duplicate general_register_no values. Please resolve before adding unique constraint.', duplicate_count;
--   END IF;
--   
--   SELECT COUNT(*) INTO duplicate_count
--   FROM (
--     SELECT affiliation_no, COUNT(*) as cnt
--     FROM schools
--     WHERE affiliation_no IS NOT NULL
--     GROUP BY affiliation_no
--     HAVING COUNT(*) > 1
--   ) duplicates;
--   
--   IF duplicate_count > 0 THEN
--     RAISE WARNING 'Found % duplicate affiliation_no values. Please resolve before adding unique constraint.', duplicate_count;
--   END IF;
-- END $$;

-- Add unique constraints
-- Note: UNIQUE constraint in PostgreSQL allows multiple NULL values, which is what we want
-- So if a field is NULL, it won't conflict with another NULL value

-- Add unique constraint for school_recognition_no (allows NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_recognition_no_unique 
ON schools(school_recognition_no) 
WHERE school_recognition_no IS NOT NULL;

-- Add unique constraint for general_register_no (allows NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_general_register_no_unique 
ON schools(general_register_no) 
WHERE general_register_no IS NOT NULL;

-- Add unique constraint for affiliation_no (allows NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_affiliation_no_unique 
ON schools(affiliation_no) 
WHERE affiliation_no IS NOT NULL;

-- Comments
COMMENT ON INDEX idx_schools_recognition_no_unique IS 'Ensures school_recognition_no is unique (allows NULL)';
COMMENT ON INDEX idx_schools_general_register_no_unique IS 'Ensures general_register_no is unique (allows NULL)';
COMMENT ON INDEX idx_schools_affiliation_no_unique IS 'Ensures affiliation_no is unique (allows NULL)';

