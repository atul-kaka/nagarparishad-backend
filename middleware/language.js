/**
 * Language Detection Middleware
 * Detects user's preferred language from request headers or query parameters
 * Sets req.language to 'en' (English) or 'mr' (Marathi)
 */

/**
 * Detect language from request
 * Priority: 1. Query param (?lang=en), 2. X-Language header, 3. Accept-Language header, 4. Default (mr)
 */
function detectLanguage(req, res, next) {
  let language = 'mr'; // Default to Marathi
  
  // 1. Check query parameter
  if (req.query.lang) {
    language = req.query.lang.toLowerCase();
  }
  // 2. Check custom header
  else if (req.headers['x-language']) {
    language = req.headers['x-language'].toLowerCase();
  }
  // 3. Check Accept-Language header
  else if (req.headers['accept-language']) {
    const acceptLang = req.headers['accept-language'].toLowerCase();
    // Check if English is preferred
    if (acceptLang.includes('en')) {
      language = 'en';
    } else if (acceptLang.includes('mr') || acceptLang.includes('marathi')) {
      language = 'mr';
    }
  }
  
  // Normalize language code
  req.language = (language === 'en' || language === 'english') ? 'en' : 'mr';
  
  // Add language to response headers for debugging
  res.setHeader('X-Response-Language', req.language);
  
  next();
}

/**
 * Language response transformer middleware
 * Transforms response data based on detected language
 * This can be used to automatically map _en or _mr fields
 */
function languageResponse(req, res, next) {
  const originalJson = res.json;
  
  res.json = function(data) {
    if (data && data.data && typeof data.data === 'object') {
      // Transform single object
      if (!Array.isArray(data.data)) {
        data.data = transformLanguageFields(data.data, req.language);
      } 
      // Transform array of objects
      else {
        data.data = data.data.map(item => transformLanguageFields(item, req.language));
      }
    }
    
    // Add language indicator to response
    if (data && typeof data === 'object') {
      data.language = req.language;
    }
    
    return originalJson.call(this, data);
  };
  
  next();
}

/**
 * Transform object fields based on language
 * Maps _en or _mr suffixed fields to main field names
 */
function transformLanguageFields(obj, language) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const suffix = language === 'en' ? '_en' : '_mr';
  const transformed = { ...obj };
  
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
  
  translatableFields.forEach(field => {
    const langField = `${field}${suffix}`;
    
    // If language-specific field exists, use it
    if (transformed[langField] !== undefined && transformed[langField] !== null) {
      transformed[field] = transformed[langField];
    }
    // Otherwise, keep original field (fallback to Marathi)
    // Original field is already in transformed object
  });
  
  return transformed;
}

module.exports = {
  detectLanguage,
  languageResponse,
  transformLanguageFields
};

