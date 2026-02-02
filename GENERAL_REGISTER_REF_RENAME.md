# General Register Reference Field Rename

## Change Summary

The field `general_register_ref` in the `students` table has been renamed to `school_general_register_no` to better reflect that it references the school's `general_register_no` field.

## Migration

**File:** `database/migrations/012_rename_general_register_ref_to_school_general_register_no.sql`

```sql
ALTER TABLE students 
  RENAME COLUMN general_register_ref TO school_general_register_no;
```

## Field Mapping

### Database Column
- **Old:** `general_register_ref`
- **New:** `school_general_register_no`

### API Field Names (camelCase)
- **Frontend Input:** `generalRegisterReference` or `schoolGeneralRegisterNo`
- **Backend Storage:** `school_general_register_no`
- **API Response:** `generalRegisterReference` (for backward compatibility)

## Updated Files

1. **Database Migration:**
   - `database/migrations/012_rename_general_register_ref_to_school_general_register_no.sql`

2. **Models:**
   - `models/Student.js` - Updated all references

3. **Routes:**
   - `routes/students.js` - Updated field list
   - `routes/students-consolidated.js` - Updated field mapping

4. **Middleware:**
   - `middleware/fieldMapper.js` - Updated field mapping:
     - `generalRegisterReference` → `school_general_register_no`
     - `schoolGeneralRegisterNo` → `school_general_register_no`
     - Response: `school_general_register_no` → `generalRegisterReference`

5. **Swagger:**
   - `config/swagger.js` - Updated schema definition

## Backward Compatibility

The API maintains backward compatibility:
- **Input:** Accepts both `generalRegisterReference` and `schoolGeneralRegisterNo`
- **Output:** Returns `generalRegisterReference` (camelCase)

## Usage

### Creating/Updating Student

**Request (camelCase):**
```json
{
  "generalRegisterReference": "GR001",
  // OR
  "schoolGeneralRegisterNo": "GR001"
}
```

**Stored in Database:**
```sql
school_general_register_no = 'GR001'
```

**Response (camelCase):**
```json
{
  "generalRegisterReference": "GR001"
}
```

## Migration Steps

1. **Run the migration:**
   ```sql
   ALTER TABLE students 
     RENAME COLUMN general_register_ref TO school_general_register_no;
   ```

2. **Restart the server** to load updated models

3. **Test the API** to ensure field mapping works correctly

## Notes

- The field now clearly indicates it references the school's general register number
- Both field names (`generalRegisterReference` and `schoolGeneralRegisterNo`) are accepted for input
- Response always uses `generalRegisterReference` for consistency
- This aligns with the naming convention where school-related fields are prefixed with `school_`

