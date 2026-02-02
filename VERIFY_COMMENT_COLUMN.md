# Verify Comment Column

## Check if Comment Column Exists

Run this SQL query in your database:

```sql
-- Check if comment column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'students' 
AND column_name = 'comment';
```

**Expected Result:**
```
column_name | data_type | is_nullable
------------|-----------|------------
comment     | text      | YES
```

## Check All Columns in Students Table

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'students'
ORDER BY ordinal_position;
```

## Use the Verification Script

```bash
npm run verify-comment
```

Or directly:
```bash
node scripts/verify-comment-column.js
```

## Test the Comment Field

After verifying the column exists, test it with a PATCH request:

```bash
PATCH /api/students/22/status
{
  "status": "in_review",
  "comment": "Test comment - verifying comment field works"
}
```

Then check if it was saved:
```sql
SELECT id, student_id, status, comment FROM students WHERE id = 22;
```



