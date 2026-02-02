# School Unique Identifier Requirement

## Requirement

**When adding a school, at least ONE of these fields must be provided:**
- `school_recognition_no`
- `affiliation_no`
- `general_register_no`

**And whichever field(s) are provided must be unique across all schools.**

---

## Current Implementation ✅

### 1. Validation on Create

When creating a school, the system:
1. ✅ Checks that **at least one identifier is provided**
2. ✅ Validates that **each provided identifier is unique**
3. ✅ Returns clear error messages if validation fails

### 2. Validation on Update

When updating a school:
1. ✅ Prevents removing all identifiers (if school currently has one)
2. ✅ Validates that **new identifier values are unique**
3. ✅ Allows updating without changing identifiers

### 3. Database Constraints

Unique indexes ensure uniqueness at the database level:
- `school_recognition_no` - Unique if provided
- `general_register_no` - Unique if provided  
- `affiliation_no` - Unique if provided

---

## Examples

### ✅ Valid Scenarios

**Scenario 1: Only school_recognition_no**
```json
POST /api/schools
{
  "name": "School A",
  "district": "Nagpur",
  "school_recognition_no": "4260/37"
}
```
✅ Accepted - Has one unique identifier

**Scenario 2: Only general_register_no**
```json
POST /api/schools
{
  "name": "School B",
  "district": "Nagpur",
  "general_register_no": "GR001"
}
```
✅ Accepted - Has one unique identifier

**Scenario 3: Only affiliation_no**
```json
POST /api/schools
{
  "name": "School C",
  "district": "Nagpur",
  "affiliation_no": "AFF001"
}
```
✅ Accepted - Has one unique identifier

**Scenario 4: Multiple identifiers (all unique)**
```json
POST /api/schools
{
  "name": "School D",
  "district": "Nagpur",
  "school_recognition_no": "4260/38",
  "general_register_no": "GR002",
  "affiliation_no": "AFF002"
}
```
✅ Accepted - Has multiple unique identifiers

---

### ❌ Invalid Scenarios

**Scenario 1: No identifier provided**
```json
POST /api/schools
{
  "name": "School X",
  "district": "Nagpur"
}
```
❌ **Error 400:**
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

**Scenario 2: Duplicate school_recognition_no**
```json
POST /api/schools
{
  "name": "School Y",
  "district": "Nagpur",
  "school_recognition_no": "4260/37"  // Already exists
}
```
❌ **Error 409:**
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

**Scenario 3: Duplicate general_register_no**
```json
POST /api/schools
{
  "name": "School Z",
  "district": "Nagpur",
  "general_register_no": "GR001"  // Already exists
}
```
❌ **Error 409:** Duplicate general_register_no

**Scenario 4: Duplicate affiliation_no**
```json
POST /api/schools
{
  "name": "School W",
  "district": "Nagpur",
  "affiliation_no": "AFF001"  // Already exists
}
```
❌ **Error 409:** Duplicate affiliation_no

---

## API Response Codes

| Status | Meaning | Example |
|--------|---------|---------|
| `201 Created` | School created successfully | Valid school with unique identifier(s) |
| `400 Bad Request` | Validation failed | Missing identifier |
| `409 Conflict` | Duplicate found | Identifier already exists |
| `500 Internal Server Error` | Server error | Database connection issue |

---

## Testing

### Test 1: Create School Without Identifier (Should Fail)

```bash
curl -X POST http://localhost:3000/api/schools \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test School",
    "district": "Test"
  }'
```

**Expected:** `400 Bad Request` - "At least one identifier is required"

---

### Test 2: Create School With Unique Identifier (Should Succeed)

```bash
curl -X POST http://localhost:3000/api/schools \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test School",
    "district": "Test",
    "schoolRecognitionNumber": "UNIQUE123"
  }'
```

**Expected:** `201 Created` - School created successfully

---

### Test 3: Create School With Duplicate Identifier (Should Fail)

```bash
curl -X POST http://localhost:3000/api/schools \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another School",
    "district": "Test",
    "schoolRecognitionNumber": "UNIQUE123"
  }'
```

**Expected:** `409 Conflict` - "School recognition number already exists"

---

## Implementation Files

1. **`models/School.js`**
   - `create()` - Validates at least one identifier + checks duplicates
   - `update()` - Prevents removing all identifiers + checks duplicates
   - `checkForDuplicates()` - Validates uniqueness of provided identifiers

2. **`routes/schools.js`**
   - Handles `400` errors for missing identifiers
   - Handles `409` errors for duplicate identifiers

3. **`database/migrations/007_add_unique_constraints_schools.sql`**
   - Creates unique indexes on all three identifier fields

4. **`swagger.yaml`**
   - Documents the requirement and error responses

---

## Summary

✅ **Requirement Met:**
- At least ONE identifier must be provided when creating a school
- Each provided identifier must be unique
- Clear error messages for validation failures
- Database-level constraints ensure data integrity

**The implementation is complete and working as specified!**



