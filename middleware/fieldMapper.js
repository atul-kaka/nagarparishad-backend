/**
 * Middleware to map frontend camelCase fields to backend snake_case fields
 * Handles certificate data transformation
 */

// Field mapping from frontend (camelCase) to backend (snake_case)
const certificateFieldMap = {
  // School fields
  phoneNumber: 'phone_no',
  serialNumber: 'serial_no',
  schoolRecognitionNumber: 'school_recognition_no',
  udiseNumber: 'udise_no',
  generalRegisterNumber: 'general_register_no',
  affiliationNumber: 'affiliation_no',
  
  // Student fields
  studentId: 'student_id',
  studentFullName: 'full_name',
  uidAadhaarNumber: 'uid_aadhar_no',
  fullName: 'full_name',
  fatherName: 'father_name',
  motherName: 'mother_name',
  motherTongue: 'mother_tongue',
  subCaste: 'sub_caste',
  placeOfBirth: 'birth_place_village',
  dateOfBirth: 'date_of_birth',
  dateOfBirthInWords: 'date_of_birth_words',
  
  // Certificate fields
  previousSchool: 'previous_school',
  previousClass: 'previous_class',
  admissionDate: 'admission_date',
  admissionClass: 'admission_class',
  academicProgress: 'progress_in_studies',
  leavingDate: 'leaving_date',
  leavingClass: 'leaving_class',
  classStudyingDetails: 'studying_class_and_since',
  reasonForLeaving: 'reason_for_leaving',
  generalRegisterReference: 'school_general_register_no',
  schoolGeneralRegisterNo: 'school_general_register_no',
  certificateDate: 'certificate_date',
  certificateMonth: 'certificate_month',
  certificateYear: 'certificate_year',
  classTeacherSignature: 'class_teacher_signature',
  clerkSignature: 'clerk_signature',
  headmasterSignature: 'headmaster_signature',
  
  // Audit fields
  createdBy: 'created_by',
  updatedBy: 'updated_by'
};

// Reverse mapping for responses (snake_case to camelCase)
const reverseFieldMap = {};
Object.keys(certificateFieldMap).forEach(key => {
  reverseFieldMap[certificateFieldMap[key]] = key;
});

// Override for backward compatibility - prefer generalRegisterReference over schoolGeneralRegisterNo
reverseFieldMap['school_general_register_no'] = 'generalRegisterReference';
// Backward compatibility: also map old column name if migration hasn't been run yet
reverseFieldMap['general_register_ref'] = 'generalRegisterReference';

// Map school fields to camelCase for responses
reverseFieldMap['school_udise_no'] = 'udiseNo';
reverseFieldMap['school_affiliation_no'] = 'affiliationNo';
reverseFieldMap['school_recognition_no'] = 'schoolRecognitionNumber';

/**
 * Convert camelCase object to snake_case
 */
function toSnakeCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const converted = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Check if field needs mapping
    const mappedKey = certificateFieldMap[key] || key;
    
    // Handle nested objects
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      converted[mappedKey] = toSnakeCase(value);
    } else if (Array.isArray(value)) {
      converted[mappedKey] = value.map(item => 
        typeof item === 'object' ? toSnakeCase(item) : item
      );
    } else {
      converted[mappedKey] = value;
    }
  }
  
  return converted;
}

/**
 * Convert snake_case object to camelCase
 */
function toCamelCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const converted = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Check if field needs reverse mapping
    const mappedKey = reverseFieldMap[key] || key;
    
    // Convert key to camelCase if not in reverse map
    const camelKey = mappedKey === key ? snakeToCamel(key) : mappedKey;
    
    // Handle nested objects
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      converted[camelKey] = toCamelCase(value);
    } else if (Array.isArray(value)) {
      converted[camelKey] = value.map(item => 
        typeof item === 'object' ? toCamelCase(item) : item
      );
    } else {
      converted[camelKey] = value;
    }
  }
  
  return converted;
}

/**
 * Convert snake_case string to camelCase
 */
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert Marathi numerals to Arabic numerals
 * Handles common Marathi number words
 */
function convertMarathiYear(yearStr) {
  if (!yearStr || typeof yearStr !== 'string') return yearStr;
  
  // If already a number, return as is
  if (!isNaN(yearStr)) return parseInt(yearStr);
  
  // Marathi numeral to Arabic mapping
  const marathiToArabic = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  };
  
  // Convert Marathi numerals
  let converted = '';
  for (const char of yearStr) {
    converted += marathiToArabic[char] || char;
  }
  
  // Try to parse as integer
  const parsed = parseInt(converted);
  return isNaN(parsed) ? yearStr : parsed;
}

/**
 * Middleware to transform request body from camelCase to snake_case
 */
function mapFieldsToSnakeCase(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    // Handle nested data object (frontend format)
    if (req.body.data && typeof req.body.data === 'object') {
      // Merge data object into body, converting field names
      const convertedData = toSnakeCase(req.body.data);
      req.body = {
        ...req.body,
        ...convertedData
      };
      
      // Convert certificate_year if it's in Marathi numerals
      if (req.body.certificate_year) {
        req.body.certificate_year = convertMarathiYear(req.body.certificate_year);
      }
      
      // Keep other top-level fields like status, createdBy, etc.
      if (req.body.createdBy) {
        req.body.created_by = req.body.createdBy;
        delete req.body.createdBy;
      }
      if (req.body.updatedBy) {
        req.body.updated_by = req.body.updatedBy;
        delete req.body.updatedBy;
      }
      // Remove the nested data object
      delete req.body.data;
    } else {
      // Convert entire body
      req.body = toSnakeCase(req.body);
      
      // Convert certificate_year if it's in Marathi numerals
      if (req.body.certificate_year) {
        req.body.certificate_year = convertMarathiYear(req.body.certificate_year);
      }
    }
  }
  next();
}

/**
 * Middleware to transform response from snake_case to camelCase
 */
function mapFieldsToCamelCase(req, res, next) {
  const originalJson = res.json;
  
  res.json = function(data) {
    if (data && data.data && typeof data.data === 'object') {
      if (Array.isArray(data.data)) {
        data.data = data.data.map(item => toCamelCase(item));
      } else {
        data.data = toCamelCase(data.data);
      }
    }
    return originalJson.call(this, data);
  };
  
  next();
}

module.exports = {
  toSnakeCase,
  toCamelCase,
  mapFieldsToSnakeCase,
  mapFieldsToCamelCase,
  certificateFieldMap,
  convertMarathiYear
};

