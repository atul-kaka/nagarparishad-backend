# Frontend Integration Guide

This guide explains how to integrate the frontend with the backend API, including field name mapping.

---

## Field Name Mapping

The frontend uses **camelCase** while the backend uses **snake_case**. The API automatically converts between these formats.

### Frontend Format (camelCase) → Backend Format (snake_case)

| Frontend Field | Backend Field |
|---------------|---------------|
| `phoneNumber` | `phone_no` |
| `serialNumber` | `serial_no` |
| `schoolRecognitionNumber` | `school_recognition_no` |
| `udiseNumber` | `udise_no` |
| `generalRegisterNumber` | `general_register_no` |
| `affiliationNumber` | `affiliation_no` |
| `studentId` | `student_id` |
| `uidAadhaarNumber` | `uid_aadhar_no` |
| `fullName` | `full_name` |
| `fatherName` | `father_name` |
| `motherName` | `mother_name` |
| `motherTongue` | `mother_tongue` |
| `subCaste` | `sub_caste` |
| `placeOfBirth` | `birth_place_village` |
| `dateOfBirth` | `date_of_birth` |
| `dateOfBirthInWords` | `date_of_birth_words` |
| `previousSchool` | `previous_school` |
| `previousClass` | `previous_class` |
| `admissionDate` | `admission_date` |
| `admissionClass` | `admission_class` |
| `academicProgress` | `progress_in_studies` |
| `leavingDate` | `leaving_date` |
| `leavingClass` | `leaving_class` |
| `classStudyingDetails` | `studying_class_and_since` |
| `reasonForLeaving` | `reason_for_leaving` |
| `generalRegisterReference` | `general_register_ref` |
| `certificateDate` | `certificate_date` |
| `certificateMonth` | `certificate_month` |
| `certificateYear` | `certificate_year` |
| `classTeacherSignature` | `class_teacher_name` |
| `clerkSignature` | `clerk_name` |
| `headmasterSignature` | `headmaster_name` |
| `createdBy` | `created_by` |
| `updatedBy` | `updated_by` |

---

## API Endpoints

### Option 1: Use Existing Endpoints (with Auto-Conversion)

The existing endpoints now automatically convert camelCase to snake_case:

**POST** `/api/certificates`

```javascript
// Frontend can send camelCase
fetch('http://localhost:3000/api/certificates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    school_id: 1,  // You need school_id and student_id first
    student_id: 1,
    serialNumber: "102",
    leavingDate: "2024-03-25",
    leavingClass: "आठवी",
    fullName: "प्रिया सुनील देशमुख",
    // ... other fields in camelCase
  })
})
```

### Option 2: Use Bulk Endpoint (Recommended for Frontend)

**POST** `/api/certificates/bulk`

This endpoint accepts your frontend format directly and creates school, student, and certificate in one request.

```javascript
// Frontend format - exactly as you have it
const certificateData = {
  data: {
    phoneNumber: "07114-234567",
    serialNumber: "102",
    schoolRecognitionNumber: "SR-2024-002",
    udiseNumber: "27090100102",
    email: "school@ramtekparishad.gov.in",
    generalRegisterNumber: "GR-5002",
    medium: "मराठी",
    affiliationNumber: "AFF-2024-124",
    studentId: "STU-0002",
    uidAadhaarNumber: "234523452345",
    fullName: "प्रिया सुनील देशमुख",
    fatherName: "सुनील देशमुख",
    surname: "देशमुख",
    motherName: "कविता देशमुख",
    nationality: "भारतीय",
    motherTongue: "मराठी",
    religion: "हिंदू",
    caste: "मराठा",
    subCaste: "देशमुख",
    placeOfBirth: "रामटेक",
    taluka: "रामटेक",
    district: "नागपूर",
    state: "महाराष्ट्र",
    country: "भारत",
    dateOfBirth: "2011-08-20",
    dateOfBirthInWords: "वीस ऑगस्ट दोन हजार अकरा",
    previousSchool: "झतिरामजी बर्वे नगर परिषद प्राथमिक शाळा, रामटेक",
    previousClass: "पाचवी",
    admissionDate: "2018-06-10",
    admissionClass: "सहावी",
    academicProgress: "उत्तम",
    conduct: "उत्तम",
    leavingDate: "2024-03-25",
    leavingClass: "आठवी",
    classStudyingDetails: "आठवीत शिकत होती",
    reasonForLeaving: "शैक्षणिक कारणास्तव",
    remarks: "अभ्यासू व मेहनती विद्यार्थी",
    generalRegisterReference: "5002",
    certificateDate: "2024-04-01",
    certificateMonth: "एप्रिल",
    certificateYear: "२०२४",
    classTeacherSignature: "वर्गशिक्षक",
    clerkSignature: "लेखनिक",
    headmasterSignature: "मुख्याध्यापक"
  },
  createdBy: "admin" // User ID or username
};

fetch('http://localhost:3000/api/certificates/bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(certificateData)
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## Complete Example: Frontend to Backend

### Step 1: Frontend Form Data

```javascript
const formData = {
  id: "student-2-002",
  data: {
    phoneNumber: "07114-234567",
    serialNumber: "102",
    schoolRecognitionNumber: "SR-2024-002",
    udiseNumber: "27090100102",
    email: "school@ramtekparishad.gov.in",
    generalRegisterNumber: "GR-5002",
    medium: "मराठी",
    affiliationNumber: "AFF-2024-124",
    studentId: "STU-0002",
    uidAadhaarNumber: "234523452345",
    fullName: "प्रिया सुनील देशमुख",
    fatherName: "सुनील देशमुख",
    surname: "देशमुख",
    motherName: "कविता देशमुख",
    nationality: "भारतीय",
    motherTongue: "मराठी",
    religion: "हिंदू",
    caste: "मराठा",
    subCaste: "देशमुख",
    placeOfBirth: "रामटेक",
    taluka: "रामटेक",
    district: "नागपूर",
    state: "महाराष्ट्र",
    country: "भारत",
    dateOfBirth: "2011-08-20",
    dateOfBirthInWords: "वीस ऑगस्ट दोन हजार अकरा",
    previousSchool: "झतिरामजी बर्वे नगर परिषद प्राथमिक शाळा, रामटेक",
    previousClass: "पाचवी",
    admissionDate: "2018-06-10",
    admissionClass: "सहावी",
    academicProgress: "उत्तम",
    conduct: "उत्तम",
    leavingDate: "2024-03-25",
    leavingClass: "आठवी",
    classStudyingDetails: "आठवीत शिकत होती",
    reasonForLeaving: "शैक्षणिक कारणास्तव",
    remarks: "अभ्यासू व मेहनती विद्यार्थी",
    generalRegisterReference: "5002",
    certificateDate: "2024-04-01",
    certificateMonth: "एप्रिल",
    certificateYear: "२०२४",
    classTeacherSignature: "वर्गशिक्षक",
    clerkSignature: "लेखनिक",
    headmasterSignature: "मुख्याध्यापक"
  },
  createdBy: "admin"
};
```

### Step 2: Send to API

```javascript
// Option A: Use bulk endpoint (recommended)
const response = await fetch('http://localhost:3000/api/certificates/bulk', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    data: formData.data,
    created_by: 1 // User ID from your system
  })
});

const result = await response.json();
console.log(result);
```

### Step 3: Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "school_id": 1,
    "student_id": 1,
    "serial_no": "102",
    // ... certificate data in snake_case
  },
  "message": "Certificate created successfully with school and student data"
}
```

---

## Field Mapping Details

### Special Cases

1. **`placeOfBirth`** → Maps to `birth_place_village`
   - If you also have separate fields for taluka, district, state, they map to:
   - `taluka` → `birth_place_taluka`
   - `district` → `birth_place_district`
   - `state` → `birth_place_state`
   - `country` → `birth_place_country`

2. **`academicProgress`** → Maps to `progress_in_studies`

3. **`classStudyingDetails`** → Maps to `studying_class_and_since`

4. **`generalRegisterReference`** → Maps to `general_register_ref`

5. **Signature fields:**
   - `classTeacherSignature` → `class_teacher_name`
   - `clerkSignature` → `clerk_name`
   - `headmasterSignature` → `headmaster_name`

---

## Error Handling

### Validation Errors

If required fields are missing, you'll get:

```json
{
  "success": false,
  "errors": [
    {
      "type": "field",
      "msg": "School ID is required",
      "path": "school_id",
      "location": "body"
    }
  ]
}
```

### Solution: Use Bulk Endpoint

The `/api/certificates/bulk` endpoint handles school and student creation automatically, so you don't need to provide `school_id` and `student_id` separately.

---

## Status Updates

To update certificate status:

```javascript
// Update status
fetch(`http://localhost:3000/api/certificates/${certificateId}/status`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: "issued",
    reason: "All documents verified",
    user_id: 1
  })
});
```

---

## Summary

✅ **Use `/api/certificates/bulk`** for frontend integration  
✅ **Send data in camelCase** - API converts automatically  
✅ **No need to create school/student separately** - bulk endpoint handles it  
✅ **All field mappings are automatic**

Your frontend can now send data in its native format, and the API will handle the conversion!




