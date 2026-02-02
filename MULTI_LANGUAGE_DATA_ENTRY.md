# Multi-Language Data Entry Guide

This guide explains how to store data in both Marathi and English when your UI language is either Marathi or English.

## Problem Statement

- **UI Language**: Marathi OR English (user selects one)
- **Data Entry**: User enters data in the selected UI language
- **Requirement**: Store data in BOTH languages (Marathi and English)
- **Challenge**: How to get the translation when user only enters in one language?

## Solution Approaches

### Approach 1: Auto-Translation on Save (Recommended)

When user saves data in one language, automatically translate to the other language using a translation API.

**Flow:**
1. User enters data in Marathi UI → Save Marathi data
2. Backend automatically translates to English using translation API
3. Store both Marathi and English in database
4. When displaying, show data in the UI language

**Pros:**
- ✅ User only needs to enter once
- ✅ Both languages stored automatically
- ✅ Fast and convenient

**Cons:**
- ❌ Translation quality may vary
- ❌ Requires translation API (costs)
- ❌ May need manual review/correction

---

### Approach 2: Manual Translation Entry

Allow user to enter translation manually after initial save.

**Flow:**
1. User enters data in Marathi UI → Save Marathi data
2. System prompts: "Add English translation?"
3. User can add English translation later via separate form/endpoint
4. Store both when available

**Pros:**
- ✅ Accurate translations
- ✅ No API costs
- ✅ Full control

**Cons:**
- ❌ Requires manual work
- ❌ May be incomplete if user skips

---

### Approach 3: Hybrid Approach (Best for Official Documents)

Auto-translate on save, but allow manual override/correction.

**Flow:**
1. User enters data in Marathi UI → Save
2. Backend auto-translates to English
3. Store both languages
4. Provide API to update/correct translations later
5. Mark translations as "auto" or "manual" for quality tracking

**Pros:**
- ✅ Best of both worlds
- ✅ Fast initial save
- ✅ Can improve accuracy later
- ✅ Quality tracking

**Cons:**
- ❌ More complex implementation

---

## Recommended Implementation: Hybrid Approach

### Step 1: Update Database Schema

Run migration to add English columns (already created in `014_add_english_language_columns.sql`):

```sql
-- English columns already added
-- full_name_en, father_name_en, mother_name_en, etc.
```

### Step 2: Create Translation Service

```javascript
// services/translation.js
const axios = require('axios');

class TranslationService {
  /**
   * Translate text from Marathi to English
   * Uses Google Translate API or similar service
   */
  static async translateToEnglish(marathiText) {
    if (!marathiText || marathiText.trim() === '') {
      return null;
    }

    try {
      // Option 1: Google Translate API
      const response = await axios.post(
        'https://translation.googleapis.com/language/translate/v2',
        {
          q: marathiText,
          source: 'mr',  // Marathi
          target: 'en',   // English
          key: process.env.GOOGLE_TRANSLATE_API_KEY
        }
      );

      return response.data.data.translations[0].translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return null; // Return null if translation fails
    }
  }

  /**
   * Translate text from English to Marathi
   */
  static async translateToMarathi(englishText) {
    if (!englishText || englishText.trim() === '') {
      return null;
    }

    try {
      const response = await axios.post(
        'https://translation.googleapis.com/language/translate/v2',
        {
          q: englishText,
          source: 'en',
          target: 'mr',
          key: process.env.GOOGLE_TRANSLATE_API_KEY
        }
      );

      return response.data.data.translations[0].translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return null;
    }
  }

  /**
   * Translate student object fields
   */
  static async translateStudentData(studentData, fromLanguage, toLanguage) {
    const translated = { ...studentData };
    const translateFunc = toLanguage === 'en' 
      ? this.translateToEnglish.bind(this)
      : this.translateToMarathi.bind(this);

    // List of translatable fields
    const translatableFields = [
      'full_name', 'father_name', 'mother_name', 'surname',
      'nationality', 'mother_tongue', 'religion', 'caste', 'sub_caste',
      'birth_place_village', 'birth_place_taluka', 'birth_place_district',
      'birth_place_state', 'birth_place_country', 'date_of_birth_words',
      'previous_school', 'previous_class', 'admission_class',
      'progress_in_studies', 'conduct', 'leaving_class',
      'studying_class_and_since', 'reason_for_leaving', 'remarks',
      'certificate_month', 'class_teacher_signature', 'clerk_signature',
      'headmaster_signature'
    ];

    // Translate each field
    for (const field of translatableFields) {
      const value = studentData[field];
      if (value && value.trim() !== '') {
        const translatedValue = await translateFunc(value);
        if (translatedValue) {
          const targetField = toLanguage === 'en' ? `${field}_en` : `${field}_mr`;
          translated[targetField] = translatedValue;
        }
      }
    }

    return translated;
  }
}

module.exports = TranslationService;
```

### Step 3: Update Consolidated Route

Modify the consolidated route to:
1. Detect UI language from request
2. Store data in appropriate language column
3. Auto-translate to other language
4. Store both

```javascript
// routes/students-consolidated.js
const TranslationService = require('../services/translation');
const { detectLanguage } = require('../middleware/language');

router.post(
  '/consolidated',
  authenticate,
  canAddDocument,
  detectLanguage,  // Detect UI language
  mapFieldsToSnakeCase,
  async (req, res) => {
    try {
      const data = req.body;
      const uiLanguage = req.language; // 'mr' or 'en'
      
      // ... existing school lookup code ...
      
      // Prepare student data based on UI language
      const studentData = {
        // Store in the language user entered (UI language)
        [`full_name_${uiLanguage}`]: data.full_name || data.studentFullName,
        [`father_name_${uiLanguage}`]: data.father_name || data.fatherName,
        [`mother_name_${uiLanguage}`]: data.mother_name || data.motherName,
        // ... other fields with language suffix
      };

      // If translation is enabled, translate to other language
      if (process.env.ENABLE_AUTO_TRANSLATION === 'true') {
        const otherLanguage = uiLanguage === 'en' ? 'mr' : 'en';
        const translatedData = await TranslationService.translateStudentData(
          studentData,
          uiLanguage,
          otherLanguage
        );
        
        // Merge translated data
        Object.assign(studentData, translatedData);
        
        // Mark translations as auto-generated
        studentData.translation_source = 'auto';
      }

      // Create/update student with both languages
      const student = await Student.create(studentData);
      
      res.json({
        success: true,
        data: student,
        message: `Student created in ${uiLanguage === 'mr' ? 'Marathi' : 'English'}`,
        translation_status: process.env.ENABLE_AUTO_TRANSLATION === 'true' ? 'auto' : 'pending'
      });
    } catch (error) {
      // ... error handling
    }
  }
);
```

### Step 4: Add Translation Update Endpoint

Allow manual translation updates:

```javascript
// routes/students.js
router.patch('/:id/translations', authenticate, canEditDocument, async (req, res) => {
  try {
    const { id } = req.params;
    const { language, translations } = req.body; // language: 'en' or 'mr'
    
    // Update translation fields
    const updateData = {};
    Object.keys(translations).forEach(field => {
      const targetField = `${field}_${language}`;
      updateData[targetField] = translations[field];
    });
    
    updateData.translation_source = 'manual'; // Mark as manual
    updateData.updated_by = req.user.id;
    
    const student = await Student.update(id, updateData);
    
    res.json({
      success: true,
      data: student,
      message: `${language === 'en' ? 'English' : 'Marathi'} translations updated`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Step 5: Update Student Model

Modify queries to return data in requested language:

```javascript
// models/Student.js
static async findById(id, language = 'mr') {
  const langSuffix = language === 'en' ? '_en' : '_mr';
  
  const query = `
    SELECT 
      s.id, s.student_id, s.uid_aadhar_no,
      -- Use language-specific field if available, else fallback to Marathi
      COALESCE(s.full_name${langSuffix}, s.full_name) as full_name,
      COALESCE(s.father_name${langSuffix}, s.father_name) as father_name,
      COALESCE(s.mother_name${langSuffix}, s.mother_name) as mother_name,
      -- ... other fields
    FROM students s
    WHERE s.id = $1
  `;
  // ...
}
```

---

## Environment Variables

Add to `.env`:

```bash
# Translation Settings
ENABLE_AUTO_TRANSLATION=true
GOOGLE_TRANSLATE_API_KEY=your_api_key_here

# Or use alternative translation service
TRANSLATION_SERVICE=google  # or 'microsoft', 'aws', etc.
```

---

## API Usage Examples

### Create Student in Marathi UI

```bash
POST /api/students/consolidated
Content-Type: application/json
X-Language: mr

{
  "fullName": "राजेश कुमार",
  "fatherName": "रामेश कुमार",
  "motherName": "सीता देवी",
  // ... other Marathi fields
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "full_name_mr": "राजेश कुमार",
    "full_name_en": "Rajesh Kumar",  // Auto-translated
    // ...
  },
  "translation_status": "auto"
}
```

### Create Student in English UI

```bash
POST /api/students/consolidated
Content-Type: application/json
X-Language: en

{
  "fullName": "Rajesh Kumar",
  "fatherName": "Ramesh Kumar",
  // ... other English fields
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "full_name_en": "Rajesh Kumar",
    "full_name_mr": "राजेश कुमार",  // Auto-translated
    // ...
  },
  "translation_status": "auto"
}
```

### Update Translation Manually

```bash
PATCH /api/students/1/translations
Content-Type: application/json

{
  "language": "en",
  "translations": {
    "full_name": "Rajesh Kumar Patil",  // Corrected translation
    "father_name": "Ramesh Kumar Patil"
  }
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
    "fullName": "Rajesh Kumar",  // English version
    "fatherName": "Ramesh Kumar",
    // ...
  },
  "language": "en"
}
```

---

## Alternative: Simple Field Mapping (No Translation API)

If you don't want to use translation API, you can:

1. **Accept both languages in request:**
```json
{
  "fullName": "राजेश कुमार",      // Marathi (from UI)
  "fullNameEn": "Rajesh Kumar"     // English (optional, can be added later)
}
```

2. **Store what's provided:**
```javascript
const studentData = {
  full_name_mr: data.fullName || data.fullNameMr,
  full_name_en: data.fullNameEn || null,  // Store if provided
  // ...
};
```

3. **Provide translation endpoint:**
```bash
POST /api/students/1/translate
{
  "targetLanguage": "en",
  "fields": ["full_name", "father_name"]  // Optional: specific fields
}
```

---

## Recommended Flow for Your Use Case

Since you're currently only allowing Marathi data entry:

1. **Current State**: User enters Marathi data → Store in `_mr` columns
2. **Add Translation Later**: 
   - Option A: Auto-translate on save (if API available)
   - Option B: Manual translation via separate endpoint
   - Option C: Batch translation job for existing records

3. **Display**: 
   - If UI is Marathi → Show `_mr` columns
   - If UI is English → Show `_en` columns (if available, else fallback to `_mr`)

---

## Implementation Checklist

- [ ] Run migration `014_add_english_language_columns.sql`
- [ ] Create translation service (optional if using API)
- [ ] Update consolidated route to detect UI language
- [ ] Add language detection middleware
- [ ] Update Student model queries with COALESCE
- [ ] Add translation update endpoint
- [ ] Test with Marathi data entry
- [ ] Test with English data entry (when UI supports it)
- [ ] Test translation API (if using)
- [ ] Test fallback behavior

---

## Next Steps

1. Decide: Auto-translation API or Manual entry?
2. If API: Set up Google Translate API key
3. Run database migration
4. Update routes and models
5. Test with real data

