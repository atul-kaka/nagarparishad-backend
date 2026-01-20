# Bulk Certificate Creation - cURL Example

This endpoint accepts your frontend format directly and creates school, student, and certificate in one request.

## Endpoint

**POST** `/api/certificates/bulk`

## Example Request

```bash
curl -X POST http://localhost:3000/api/certificates/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "phoneNumber": "07114-234567",
      "serialNumber": "102",
      "schoolRecognitionNumber": "SR-2024-002",
      "udiseNumber": "27090100102",
      "email": "school@ramtekparishad.gov.in",
      "generalRegisterNumber": "GR-5002",
      "medium": "मराठी",
      "affiliationNumber": "AFF-2024-124",
      "studentId": "STU-0002",
      "uidAadhaarNumber": "234523452345",
      "fullName": "प्रिया सुनील देशमुख",
      "fatherName": "सुनील देशमुख",
      "surname": "देशमुख",
      "motherName": "कविता देशमुख",
      "nationality": "भारतीय",
      "motherTongue": "मराठी",
      "religion": "हिंदू",
      "caste": "मराठा",
      "subCaste": "देशमुख",
      "placeOfBirth": "रामटेक",
      "taluka": "रामटेक",
      "district": "नागपूर",
      "state": "महाराष्ट्र",
      "country": "भारत",
      "dateOfBirth": "2011-08-20",
      "dateOfBirthInWords": "वीस ऑगस्ट दोन हजार अकरा",
      "previousSchool": "झतिरामजी बर्वे नगर परिषद प्राथमिक शाळा, रामटेक",
      "previousClass": "पाचवी",
      "admissionDate": "2018-06-10",
      "admissionClass": "सहावी",
      "academicProgress": "उत्तम",
      "conduct": "उत्तम",
      "leavingDate": "2024-03-25",
      "leavingClass": "आठवी",
      "classStudyingDetails": "आठवीत शिकत होती",
      "reasonForLeaving": "शैक्षणिक कारणास्तव",
      "remarks": "अभ्यासू व मेहनती विद्यार्थी",
      "generalRegisterReference": "5002",
      "certificateDate": "2024-04-01",
      "certificateMonth": "एप्रिल",
      "certificateYear": "२०२४",
      "classTeacherSignature": "वर्गशिक्षक",
      "clerkSignature": "लेखनिक",
      "headmasterSignature": "मुख्याध्यापक"
    },
    "createdBy": "admin"
  }'
```

## Features

✅ **Automatic field mapping** - camelCase to snake_case  
✅ **Marathi numeral conversion** - "२०२४" → 2024  
✅ **School auto-creation** - Creates school if not found by recognition number  
✅ **Student auto-creation** - Creates student if not found by student ID or Aadhar  
✅ **Certificate creation** - Creates certificate with all relationships  

## Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "school_id": 1,
    "student_id": 1,
    "serial_no": "102",
    "leaving_date": "2024-03-25",
    "leaving_class": "आठवी",
    "certificate_year": 2024,
    // ... full certificate data
  },
  "message": "Certificate created successfully with school and student data"
}
```

## Notes

- The endpoint automatically converts Marathi numerals in `certificateYear` to integers
- If a school with the same recognition number exists, it will be reused
- If a student with the same student ID or Aadhar exists, it will be reused
- All field names are automatically converted from camelCase to snake_case

