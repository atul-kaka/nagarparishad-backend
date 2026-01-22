# Unique Constraints for School Records

## Overview

This implementation prevents duplicate school records by enforcing:
- **At least ONE** of these fields must be provided: `school_recognition_no`, `general_register_no`, or `affiliation_no`
- **Whichever field(s) are provided** must be unique across all schools
- Each field individually enforces uniqueness (when provided)

**Fields:**
- `school_recognition_no` - School recognition number (must be unique if provided)
- `general_register_no` - General register number (must be unique if provided)
- `affiliation_no` - Affiliation number (must be unique if provided)

---

## Implementation Details

### 1. Database Level (Unique Constraints)

Unique indexes have been added to enforce uniqueness at the database level:

```sql
-- school_recognition_no must be unique (allows NULL)
CREATE UNIQUE INDEX idx_schools_recognition_no_unique 
ON schools(school_recognition_no) 
WHERE school_recognition_no IS NOT NULL;

-- general_register_no must be unique (allows NULL)
CREATE UNIQUE INDEX idx_schools_general_register_no_unique 
ON schools(general_register_no) 
WHERE general_register_no IS NOT NULL;

-- affiliation_no must be unique (allows NULL)
CREATE UNIQUE INDEX idx_schools_affiliation_no_unique 
ON schools(affiliation_no) 
WHERE affiliation_no IS NOT NULL;
```

**Note:** NULL values are allowed (multiple NULLs won't conflict), but non-NULL values must be unique.

---

### 2. Application Level (Validation)

The `School` model now includes:
- `checkForDuplicates()` - Checks for duplicates before insert/update
- Pre-validation in `create()` and `update()` methods
- Clear error messages identifying which field(s) have duplicates

---

### 3. API Error Response

When a duplicate is detected, the API returns:

```json
{
  "success": false,
  "error": "Duplicate record found",
  "duplicates": [
    {
      "field": "school_recognition_no",
      "value": "4260/37",
      "message": "School recognition number already exists"
    }
  ]
}
```

**HTTP Status:** `409 Conflict`

---

## Running the Migration

### Step 1: Check for Existing Duplicates

The migration script will automatically check for existing duplicates:

```bash
npm run migrate-unique
```

**If duplicates exist**, the script will:
- List all duplicate values
- Show which records have duplicates
- **Stop the migration** (you must resolve duplicates first)

### Step 2: Resolve Duplicates (if any)

If duplicates are found, you need to:

1. **Review duplicate records:**
   ```sql
   -- Check duplicates
   SELECT school_recognition_no, COUNT(*) as cnt, array_agg(id) as ids
   FROM schools
   WHERE school_recognition_no IS NOT NULL
   GROUP BY school_recognition_no
   HAVING COUNT(*) > 1;
   ```

2. **Update or delete duplicate records:**
   ```sql
   -- Update duplicate to a unique value
   UPDATE schools 
   SET school_recognition_no = 'NEW_VALUE' 
   WHERE id = <duplicate_id>;
   
   -- OR delete if it's truly a duplicate
   DELETE FROM schools WHERE id = <duplicate_id>;
   ```

3. **Re-run the migration:**
   ```bash
   npm run migrate-unique
   ```

### Step 3: Verify Constraints

After migration, test the constraints:

```sql
-- Try to insert a duplicate (should fail)
INSERT INTO schools (name, district, school_recognition_no)
VALUES ('Test School', 'Test District', 'EXISTING_VALUE');
-- Error: duplicate key value violates unique constraint
```

---

## Testing

### Test 0: Create School Without Any Identifier (Should Fail)

```bash
curl -X POST http://localhost:3000/api/schools \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test School",
    "district": "Test"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "error": "At least one identifier is required",
  "validationErrors": [
    {
      "field": "identifier",
      "message": "At least one of school_recognition_no, general_register_no, or affiliation_no must be provided"
    }
  ]
}
```

### Test 1: Create School with Duplicate Recognition Number

```bash
curl -X POST http://localhost:3000/api/schools \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test School",
    "district": "Test",
    "schoolRecognitionNumber": "EXISTING_VALUE"
  }'
```

**Expected Response (409):**
```json
{
  "success": false,
  "error": "Duplicate record found",
  "duplicates": [
    {
      "field": "school_recognition_no",
      "value": "EXISTING_VALUE",
      "message": "School recognition number already exists"
    }
  ]
}
```

### Test 2: Update School to Duplicate Value

```bash
curl -X PUT http://localhost:3000/api/schools/123 \
  -H "Content-Type: application/json" \
  -d '{
    "schoolRecognitionNumber": "EXISTING_VALUE"
  }'
```

**Expected Response (409):** Same as above

### Test 3: Create School with Unique Values

```bash
curl -X POST http://localhost:3000/api/schools \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New School",
    "district": "Test",
    "schoolRecognitionNumber": "UNIQUE_VALUE_123"
  }'
```

**Expected Response (201):** School created successfully

---

## Behavior

### ✅ Allowed

- Creating schools with at least one unique identifier field
- Creating schools with one or more identifier fields (not all three required)
- Creating schools where different schools use different identifier fields
  - Example: School A uses `school_recognition_no`, School B uses `general_register_no`
- Updating a school without changing identifier fields
- Updating a school to unique identifier values
- Multiple NULL values (allowed - only non-NULL values must be unique)

### ❌ Prevented

- Creating a school without any identifier (no `school_recognition_no`, `general_register_no`, or `affiliation_no`)
- Creating a school with a `school_recognition_no` that already exists
- Creating a school with a `general_register_no` that already exists
- Creating a school with an `affiliation_no` that already exists
- Updating a school to remove all identifier fields
- Updating a school to use any duplicate identifier value

---

## Model Methods Added

### `School.checkForDuplicates(schoolData, excludeId)`

Checks for duplicate values before insert/update.

**Parameters:**
- `schoolData` - Object containing school data
- `excludeId` - Optional ID to exclude from check (for updates)

**Returns:** Array of duplicate errors (empty if no duplicates)

**Example:**
```javascript
const errors = await School.checkForDuplicates({
  school_recognition_no: '4260/37'
});

if (errors.length > 0) {
  console.log('Duplicates found:', errors);
}
```

### `School.findByGeneralRegisterNo(generalRegisterNo)`

Find school by general register number.

### `School.findByAffiliationNo(affiliationNo)`

Find school by affiliation number.

---

## Files Modified

1. **`database/migrations/007_add_unique_constraints_schools.sql`**
   - SQL migration to add unique indexes

2. **`scripts/migrate-unique-constraints.js`**
   - Migration script with duplicate checking

3. **`models/School.js`**
   - Added `checkForDuplicates()` method
   - Added `findByGeneralRegisterNo()` method
   - Added `findByAffiliationNo()` method
   - Updated `create()` with duplicate checking
   - Updated `update()` with duplicate checking

4. **`routes/schools.js`**
   - Added duplicate error handling (409 status)
   - Returns detailed error messages

5. **`package.json`**
   - Added `migrate-unique` script

---

## Troubleshooting

### Error: "duplicate key value violates unique constraint"

This means a duplicate value was inserted despite validation. This can happen if:
- Data was inserted directly via SQL
- Race condition (two requests at the same time)

**Solution:** Check application logs and ensure proper validation is in place.

### Migration fails with existing duplicates

**Solution:** 
1. Review duplicate records
2. Update or delete duplicates
3. Re-run migration

### Need to remove unique constraint

```sql
-- Remove unique constraints
DROP INDEX IF EXISTS idx_schools_recognition_no_unique;
DROP INDEX IF EXISTS idx_schools_general_register_no_unique;
DROP INDEX IF EXISTS idx_schools_affiliation_no_unique;
```

---

## Summary

✅ **Database-level protection** - Unique indexes prevent duplicates
✅ **Application-level validation** - Pre-checks before insert/update
✅ **Clear error messages** - API returns specific duplicate fields
✅ **Migration safety** - Checks for existing duplicates before applying constraints

The system now prevents duplicate school records at both the database and application levels!

