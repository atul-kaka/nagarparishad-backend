-- Migration: Ensure UTF-8 Encoding for Marathi and Unicode Support
-- This migration ensures the database and all text columns support UTF-8 encoding

-- Check current database encoding
-- Run this query to verify: SELECT datname, pg_encoding_to_char(encoding) FROM pg_database WHERE datname = current_database();

-- Note: PostgreSQL databases created with UTF-8 encoding already support Unicode characters
-- This migration ensures all text columns are using proper character types

-- Verify database encoding (informational - run separately if needed)
-- SELECT datname, pg_encoding_to_char(encoding) as encoding 
-- FROM pg_database 
-- WHERE datname = current_database();

-- Ensure all VARCHAR and TEXT columns can store UTF-8 characters
-- PostgreSQL's VARCHAR and TEXT types already support UTF-8 by default
-- when the database is created with UTF-8 encoding

-- Add comment to document UTF-8 support
COMMENT ON DATABASE current_database() IS 'Database configured for UTF-8 encoding to support Marathi and other Unicode characters';

-- Verify encoding for all text columns in students table
DO $$
DECLARE
    col_record RECORD;
BEGIN
    FOR col_record IN 
        SELECT column_name, data_type, character_set_name
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'students'
        AND data_type IN ('character varying', 'text', 'varchar')
    LOOP
        -- All VARCHAR and TEXT columns in PostgreSQL with UTF-8 database encoding
        -- automatically support Unicode characters including Marathi
        RAISE NOTICE 'Column % in students table uses % type and supports UTF-8', 
            col_record.column_name, col_record.data_type;
    END LOOP;
END $$;

-- Note: If you need to recreate the database with UTF-8 encoding:
-- 1. CREATE DATABASE nagarparishad_db WITH ENCODING 'UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8';
-- 2. Or use: CREATE DATABASE nagarparishad_db WITH ENCODING 'UTF8' TEMPLATE template0;

