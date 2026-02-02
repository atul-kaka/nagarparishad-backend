# Multi-Language Implementation Summary

## ✅ What's Been Implemented

Your system now supports storing and retrieving data in both **Marathi** and **English** based on the UI language.

## How It Works

### 1. **Language Detection**
The system automatically detects the UI language from:
- Query parameter: `?lang=en` or `?lang=mr`
- Header: `X-Language: en` or `Accept-Language: en`
- Default: **Marathi (mr)** if not specified

### 2. **Data Storage**
When you create/update a student:
- **If UI is Marathi**: Data is stored in `_mr` columns (e.g., `full_name_mr`, `father_name_mr`)
- **If UI is English**: Data is stored in `_en` columns (e.g., `full_name_en`, `father_name_en`)
- **If both languages provided**: Both are stored

### 3. **Data Retrieval**
When you fetch a student:
- **If UI is Marathi**: Returns data from `_mr` columns (or original columns as fallback)
- **If UI is English**: Returns data from `_en` columns (or falls back to Marathi if English not available)

## Database Schema

### Current Columns (Marathi - Original)
- `full_name`, `father_name`, `mother_name`, etc.
- These are treated as Marathi by default

### New Columns (English - Added by Migration)
- `full_name_en`, `father_name_en`, `mother_name_en`, etc.
- Added by migration `014_add_english_language_columns.sql`

## API Usage

### Create Student in Marathi UI

```bash
POST /api/students/consolidated
Content-Type: application/json
X-Language: mr

{
  "fullName": "राजेश कुमार",
  "fatherName": "रामेश कुमार",
  "motherName": "सीता देवी",
  "dateOfBirth": "2010-01-15"
  // ... other Marathi fields
}
```

**What Happens:**
- Data stored in: `full_name_mr`, `father_name_mr`, `mother_name_mr`
- Response shows Marathi data

### Create Student in English UI

```bash
POST /api/students/consolidated
Content-Type: application/json
X-Language: en

{
  "fullName": "Rajesh Kumar",
  "fatherName": "Ramesh Kumar",
  "motherName": "Sita Devi",
  "dateOfBirth": "2010-01-15"
  // ... other English fields
}
```

**What Happens:**
- Data stored in: `full_name_en`, `father_name_en`, `mother_name_en`
- Response shows English data

### Create Student with Both Languages

```bash
POST /api/students/consolidated
Content-Type: application/json
X-Language: mr

{
  "fullName": "राजेश कुमार",        // Marathi (stored in _mr)
  "fullNameEn": "Rajesh Kumar",      // English (stored in _en)
  "fatherName": "रामेश कुमार",
  "fatherNameEn": "Ramesh Kumar"
  // ...
}
```

**What Happens:**
- Marathi data → `_mr` columns
- English data → `_en` columns
- Both languages stored!

### Get Student in Marathi UI

```bash
GET /api/students/1?lang=mr
# or
GET /api/students/1
X-Language: mr
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "राजेश कुमार",  // From _mr column
    "fatherName": "रामेश कुमार",
    // ...
  },
  "language": "mr"
}
```

### Get Student in English UI

```bash
GET /api/students/1?lang=en
# or
GET /api/students/1
X-Language: en
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "Rajesh Kumar",  // From _en column, or Marathi if English not available
    "fatherName": "Ramesh Kumar",
    // ...
  },
  "language": "en"
}
```

## Frontend Integration

### Set Language in Request

```javascript
// Option 1: Query parameter
fetch('/api/students/1?lang=en')

// Option 2: Header
fetch('/api/students/1', {
  headers: {
    'X-Language': 'en',  // or 'mr'
    'Accept-Language': 'en'
  }
})
```

### Store User Language Preference

```javascript
// Save user preference
localStorage.setItem('language', 'mr'); // or 'en'

// Use in API calls
const language = localStorage.getItem('language') || 'mr';
fetch(`/api/students/1?lang=${language}`)
```

## Migration Steps

### Step 1: Run Database Migration

```bash
psql -U postgres -d nagarparishad_db -f database/migrations/014_add_english_language_columns.sql
```

This adds English columns for all translatable fields.

### Step 2: Update Existing Data (Optional)

If you have existing Marathi data, you can:
1. Keep it as-is (it's already in Marathi columns)
2. Add English translations later via update endpoint
3. Run a batch translation job

### Step 3: Test

1. Create a student with Marathi data → Verify stored in `_mr` columns
2. Create a student with English data → Verify stored in `_en` columns
3. Fetch in Marathi → Should show Marathi data
4. Fetch in English → Should show English data (or Marathi if English not available)

## Current Behavior

### For Your Current Setup (Marathi UI Only)

Since you're currently only allowing Marathi data entry:

1. **Data Entry**: User enters Marathi → Stored in `_mr` columns
2. **Display**: 
   - If UI is Marathi → Shows `_mr` data ✅
   - If UI is English → Shows `_en` data (if available), else falls back to `_mr` ✅

### Adding English Translations Later

You can add English translations later using:

```bash
PATCH /api/students/1
{
  "full_name_en": "Rajesh Kumar",
  "father_name_en": "Ramesh Kumar",
  // ... other English fields
}
```

## Field Mapping

The system supports multiple field name formats:

| Frontend Format | Stored As (Marathi) | Stored As (English) |
|----------------|-------------------|-------------------|
| `fullName` | `full_name_mr` | `full_name_en` |
| `fullNameMr` | `full_name_mr` | - |
| `fullNameEn` | - | `full_name_en` |
| `full_name` | `full_name_mr` | `full_name_en` |
| `full_name_mr` | `full_name_mr` | - |
| `full_name_en` | - | `full_name_en` |

## Translatable Fields

These fields support multi-language:
- `full_name`, `father_name`, `mother_name`, `surname`
- `nationality`, `mother_tongue`, `religion`, `caste`, `sub_caste`
- `birth_place_village`, `birth_place_taluka`, `birth_place_district`, `birth_place_state`, `birth_place_country`
- `date_of_birth_words`
- `previous_school`, `previous_class`, `admission_class`
- `progress_in_studies`, `conduct`, `leaving_class`
- `studying_class_and_since`, `reason_for_leaving`, `remarks`
- `certificate_month`
- `class_teacher_signature`, `clerk_signature`, `headmaster_signature`

## Non-Translatable Fields

These fields are the same in all languages:
- `student_id`, `uid_aadhar_no`
- `date_of_birth` (date)
- `admission_date`, `leaving_date`, `certificate_date`
- `certificate_year` (number)
- `serial_no`, `school_id`
- `status`, `created_by`, `updated_by`

## UTF-8 Encoding

All data is stored with UTF-8 encoding, so:
- ✅ Marathi characters (मराठी) are stored correctly
- ✅ English characters are stored correctly
- ✅ Mixed content works fine

## Next Steps

1. **Run Migration**: Add English columns to database
2. **Test**: Create students in both languages
3. **Frontend**: Update UI to send `X-Language` header
4. **Optional**: Add translation API for auto-translation
5. **Optional**: Add batch translation for existing records

## Example: Complete Flow

### Scenario: User enters data in Marathi UI

1. **Request:**
   ```json
   POST /api/students/consolidated
   X-Language: mr
   {
     "fullName": "राजेश कुमार",
     "fatherName": "रामेश कुमार"
   }
   ```

2. **Storage:**
   ```sql
   INSERT INTO students (full_name_mr, father_name_mr) 
   VALUES ('राजेश कुमार', 'रामेश कुमार');
   ```

3. **Retrieval (Marathi UI):**
   ```json
   GET /api/students/1?lang=mr
   {
     "fullName": "राजेश कुमार"  // From full_name_mr
   }
   ```

4. **Retrieval (English UI):**
   ```json
   GET /api/students/1?lang=en
   {
     "fullName": "राजेश कुमार"  // Falls back to full_name_mr (English not available)
   }
   ```

5. **Add English Translation Later:**
   ```json
   PATCH /api/students/1
   {
     "full_name_en": "Rajesh Kumar",
     "father_name_en": "Ramesh Kumar"
   }
   ```

6. **Retrieval (English UI) - After Translation:**
   ```json
   GET /api/students/1?lang=en
   {
     "fullName": "Rajesh Kumar"  // From full_name_en
   }
   ```

## Summary

✅ **Data Entry**: Store in language matching UI language  
✅ **Data Retrieval**: Return data in requested language  
✅ **Fallback**: If requested language not available, use Marathi  
✅ **UTF-8**: All characters stored correctly  
✅ **Flexible**: Can add translations later  

Your system is now ready for multi-language support! 🎉

