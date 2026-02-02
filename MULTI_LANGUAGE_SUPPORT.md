# Multi-Language Support Guide (Marathi & English)

This document explains different approaches to implement multi-language support in the Nagar Parishad backend system, allowing records to be displayed in Marathi or English based on the application language preference.

## Overview

The system needs to support:
- **Marathi (मराठी)**: Display records in Marathi when application language is Marathi
- **English**: Display records in English when application language is English

## Approaches

### Approach 1: Dual-Column Storage (Recommended)

**Concept**: Store data in both languages in separate columns.

**Pros**:
- ✅ Fast retrieval (no translation needed)
- ✅ Accurate translations (human-verified)
- ✅ No external dependencies
- ✅ Works offline
- ✅ Full control over translations

**Cons**:
- ❌ Requires storing data twice
- ❌ More storage space
- ❌ Need to maintain both languages during data entry

**Implementation**:
- Add `_en` and `_mr` (or `_mar`) suffixes to translatable columns
- Example: `full_name_en`, `full_name_mr`, `father_name_en`, `father_name_mr`

---

### Approach 2: Translation Table

**Concept**: Store translations in a separate `translations` table.

**Pros**:
- ✅ Normalized database structure
- ✅ Easy to add more languages later
- ✅ Can translate system messages too

**Cons**:
- ❌ More complex queries (JOINs required)
- ❌ Slower performance
- ❌ More complex to maintain

**Implementation**:
- Create `translations` table with `entity_type`, `entity_id`, `field_name`, `language`, `value`
- Example: `translations` table stores translations for each field

---

### Approach 3: JSON Column Storage

**Concept**: Store translations as JSON in a single column.

**Pros**:
- ✅ Flexible schema
- ✅ Easy to add new languages
- ✅ Single column per field

**Cons**:
- ❌ Harder to query/search
- ❌ No database-level constraints
- ❌ JSON parsing overhead

**Implementation**:
- Store as: `{"en": "John Doe", "mr": "जॉन डो"}`

---

### Approach 4: API-Based Translation (Not Recommended for Core Data)

**Concept**: Store in one language, translate on-the-fly using translation API.

**Pros**:
- ✅ Single source of truth
- ✅ No duplicate storage

**Cons**:
- ❌ Requires internet connection
- ❌ Translation quality issues
- ❌ API costs
- ❌ Performance overhead
- ❌ Not suitable for official documents

---

## Recommended Implementation: Approach 1 (Dual-Column)

### Step 1: Database Migration

Create migration to add English columns for all translatable fields:

```sql
-- Migration: Add English language columns for multi-language support
ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS full_name_en VARCHAR(500),
  ADD COLUMN IF NOT EXISTS father_name_en VARCHAR(500),
  ADD COLUMN IF NOT EXISTS mother_name_en VARCHAR(500),
  ADD COLUMN IF NOT EXISTS surname_en VARCHAR(255),
  ADD COLUMN IF NOT EXISTS nationality_en VARCHAR(100),
  ADD COLUMN IF NOT EXISTS mother_tongue_en VARCHAR(100),
  ADD COLUMN IF NOT EXISTS religion_en VARCHAR(100),
  ADD COLUMN IF NOT EXISTS caste_en VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sub_caste_en VARCHAR(255),
  ADD COLUMN IF NOT EXISTS birth_place_village_en VARCHAR(255),
  ADD COLUMN IF NOT EXISTS birth_place_taluka_en VARCHAR(255),
  ADD COLUMN IF NOT EXISTS birth_place_district_en VARCHAR(255),
  ADD COLUMN IF NOT EXISTS birth_place_state_en VARCHAR(255),
  ADD COLUMN IF NOT EXISTS birth_place_country_en VARCHAR(100),
  ADD COLUMN IF NOT EXISTS date_of_birth_words_en VARCHAR(500),
  ADD COLUMN IF NOT EXISTS previous_school_en VARCHAR(500),
  ADD COLUMN IF NOT EXISTS previous_class_en VARCHAR(50),
  ADD COLUMN IF NOT EXISTS admission_class_en VARCHAR(50),
  ADD COLUMN IF NOT EXISTS progress_in_studies_en VARCHAR(255),
  ADD COLUMN IF NOT EXISTS conduct_en VARCHAR(255),
  ADD COLUMN IF NOT EXISTS leaving_class_en VARCHAR(50),
  ADD COLUMN IF NOT EXISTS studying_class_and_since_en TEXT,
  ADD COLUMN IF NOT EXISTS reason_for_leaving_en TEXT,
  ADD COLUMN IF NOT EXISTS remarks_en TEXT,
  ADD COLUMN IF NOT EXISTS certificate_month_en VARCHAR(50),
  ADD COLUMN IF NOT EXISTS class_teacher_signature_en VARCHAR(255),
  ADD COLUMN IF NOT EXISTS clerk_signature_en VARCHAR(255),
  ADD COLUMN IF NOT EXISTS headmaster_signature_en VARCHAR(255);

-- Rename existing columns to _mr (Marathi) for clarity
-- Note: This is optional - you can keep original names as Marathi default
ALTER TABLE students 
  RENAME COLUMN full_name TO full_name_mr;
ALTER TABLE students 
  RENAME COLUMN father_name TO father_name_mr;
-- ... (repeat for all translatable fields)

-- OR keep original names as Marathi and add _en columns
-- (Recommended: Keep original as Marathi, add _en)
```

### Step 2: Language Detection Middleware

Create middleware to detect language from request:

```javascript
// middleware/language.js
function detectLanguage(req, res, next) {
  // Priority: 1. Query param, 2. Header, 3. Default
  const lang = req.query.lang || 
               req.headers['accept-language']?.split(',')[0]?.split('-')[0] ||
               req.headers['x-language'] ||
               'mr'; // Default to Marathi
  
  // Normalize language code
  req.language = lang.toLowerCase() === 'en' ? 'en' : 'mr';
  next();
}
```

### Step 3: Update Student Model

Modify queries to select language-specific columns:

```javascript
// models/Student.js
static async findById(id, language = 'mr') {
  const langSuffix = language === 'en' ? '_en' : '_mr';
  
  const query = `
    SELECT 
      s.id, s.student_id, s.uid_aadhar_no,
      COALESCE(s.full_name${langSuffix}, s.full_name) as full_name,
      COALESCE(s.father_name${langSuffix}, s.father_name) as father_name,
      -- ... other fields with language suffix
    FROM students s
    WHERE s.id = $1
  `;
  // ...
}
```

### Step 4: Update API Routes

Add language middleware and pass to model methods:

```javascript
// routes/students.js
const { detectLanguage } = require('../middleware/language');

router.get('/:id', detectLanguage, async (req, res) => {
  const student = await Student.findById(req.params.id, req.language);
  res.json({ success: true, data: student });
});
```

### Step 5: Update Consolidated Route

Accept both languages during creation:

```javascript
// routes/students-consolidated.js
router.post('/consolidated', authenticate, canAddDocument, async (req, res) => {
  const data = req.body;
  
  const studentData = {
    // Marathi fields (original)
    full_name_mr: data.fullName || data.fullNameMr,
    father_name_mr: data.fatherName || data.fatherNameMr,
    // English fields
    full_name_en: data.fullNameEn,
    father_name_en: data.fatherNameEn,
    // ... other fields
  };
  
  // Create student with both languages
  const student = await Student.create(studentData);
  // ...
});
```

---

## Alternative: Accept-Language Header Approach

If you want to keep single-column storage and return based on Accept-Language header:

### Implementation

```javascript
// middleware/languageResponse.js
function languageResponse(req, res, next) {
  const originalJson = res.json;
  
  res.json = function(data) {
    const lang = req.headers['accept-language']?.includes('en') ? 'en' : 'mr';
    
    if (data && data.data) {
      // Transform response based on language
      if (lang === 'en' && data.data.full_name_en) {
        data.data.full_name = data.data.full_name_en;
        data.data.father_name = data.data.father_name_en;
        // ... map all English fields
      }
      // If Marathi or no English translation, use original (Marathi)
    }
    
    return originalJson.call(this, data);
  };
  
  next();
}
```

---

## Migration Strategy

### Phase 1: Add English Columns (Non-Breaking)
1. Add `_en` columns to database
2. Keep existing columns (treat as Marathi)
3. Update API to accept both languages
4. Return Marathi by default, English if available

### Phase 2: Data Entry
1. Update forms to accept both languages
2. Store both during creation/update
3. Backfill existing records with English translations

### Phase 3: Language Selection
1. Add language detection middleware
2. Return appropriate language based on request
3. Fallback to Marathi if English not available

---

## API Usage Examples

### Create with Both Languages

```bash
POST /api/students/consolidated
{
  "fullName": "राजेश कुमार",        // Marathi (required)
  "fullNameEn": "Rajesh Kumar",      // English (optional)
  "fatherName": "रामेश कुमार",
  "fatherNameEn": "Ramesh Kumar",
  // ... other fields
}
```

### Get with Language Preference

```bash
# Get in Marathi (default)
GET /api/students/1

# Get in English
GET /api/students/1?lang=en

# Or use Accept-Language header
GET /api/students/1
Accept-Language: en
```

---

## Database Schema Example

```sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(50) UNIQUE,
  
  -- Marathi fields (original)
  full_name_mr VARCHAR(500) NOT NULL,
  father_name_mr VARCHAR(500),
  mother_name_mr VARCHAR(500),
  
  -- English fields
  full_name_en VARCHAR(500),
  father_name_en VARCHAR(500),
  mother_name_en VARCHAR(500),
  
  -- Non-translatable fields
  uid_aadhar_no VARCHAR(12) UNIQUE,
  date_of_birth DATE NOT NULL,
  -- ...
);
```

---

## Frontend Integration

### Language Selection

```javascript
// Store user preference
localStorage.setItem('language', 'mr'); // or 'en'

// Include in API requests
fetch('/api/students/1', {
  headers: {
    'Accept-Language': localStorage.getItem('language') || 'mr',
    'X-Language': localStorage.getItem('language') || 'mr'
  }
});
```

### Form Handling

```javascript
// Form data structure
const formData = {
  fullName: "राजेश कुमार",      // Marathi
  fullNameEn: "Rajesh Kumar",    // English
  // ... other fields
};
```

---

## Recommendations

1. **Start with Approach 1 (Dual-Column)**: Most reliable for official documents
2. **Keep Marathi as Default**: Since this is a Marathi system
3. **Make English Optional**: Don't require English translations
4. **Use COALESCE**: Return Marathi if English not available
5. **Add Language Indicator**: Include `language` field in API response

---

## Next Steps

1. Create database migration for English columns
2. Update Student model to handle language selection
3. Add language detection middleware
4. Update API routes to support language parameter
5. Update frontend to send language preference
6. Test with both Marathi and English data

---

## Example Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "राजेश कुमार",  // or "Rajesh Kumar" if lang=en
    "fatherName": "रामेश कुमार",  // or "Ramesh Kumar" if lang=en
    "language": "mr"  // or "en"
  }
}
```

