# Consolidated Schema Documentation

## Overview

The database schema has been updated to consolidate all certificate data into the `students` table. This eliminates the need for a separate `leaving_certificates` table, as all certificate information is now stored directly with the student record.

---

## Schema Changes

### Students Table

The `students` table now includes all certificate-related fields:

#### Basic Student Information
- `id` - Primary key
- `student_id` - Unique student identifier
- `uid_aadhar_no` - Aadhar number
- `full_name` - Student full name
- `father_name` - Father's name
- `mother_name` - Mother's name
- `surname` - Surname
- `nationality` - Nationality
- `mother_tongue` - Mother tongue
- `religion` - Religion
- `caste` - Caste
- `sub_caste` - Sub-caste
- `birth_place_village` - Birth place (village)
- `birth_place_taluka` - Birth place (taluka)
- `birth_place_district` - Birth place (district)
- `birth_place_state` - Birth place (state)
- `birth_place_country` - Birth place (country)
- `date_of_birth` - Date of birth
- `date_of_birth_words` - Date of birth in words

#### School Reference
- `school_id` - Foreign key to `schools` table

#### Certificate Fields
- `serial_no` - Certificate serial number
- `previous_school` - Previous school name
- `previous_class` - Previous class
- `admission_date` - Admission date
- `admission_class` - Admission class
- `progress_in_studies` - Academic progress
- `conduct` - Conduct
- `leaving_date` - Leaving date
- `leaving_class` - Leaving class
- `studying_class_and_since` - Class studying details
- `reason_for_leaving` - Reason for leaving
- `remarks` - Remarks
- `general_register_ref` - General register reference
- `certificate_date` - Certificate date
- `certificate_month` - Certificate month
- `certificate_year` - Certificate year
- `class_teacher_signature` - Class teacher signature
- `clerk_signature` - Clerk signature
- `headmaster_signature` - Headmaster signature
- `status` - Certificate status (new, in_review, rejected, accepted, etc.)

#### Audit Fields
- `created_by` - User ID who created the record
- `updated_by` - User ID who last updated the record
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Schools Table

The `schools` table includes:
- `school_recognition_no` - School recognition number (used for lookup)
- All other school fields remain the same

---

## Migration

Run the migration to add certificate fields to students table:

```bash
npm run migrate-consolidate
```

This will:
1. Add all certificate-related columns to `students` table
2. Add `school_id` foreign key reference
3. Create indexes for performance
4. Add unique constraint on `school_id + serial_no`

---

## API Endpoints

### Create Student with Certificate Data

**POST** `/api/students/consolidated`

Accepts your frontend JSON format and creates/updates student with all certificate data.

**Request:**
```json
{
  "data": {
    "school_recognition_no": "4260/37",
    "phoneNumber": "07114-234567",
    "serialNumber": "102",
    "studentId": "STU-0002",
    "studentFullName": "प्रिया सुनील देशमुख",
    "fatherName": "सुनील देशमुख",
    "motherName": "कविता देशमुख",
    "dateOfBirth": "2011-08-20",
    "leavingDate": "2024-03-25",
    "leavingClass": "आठवी",
    "certificateYear": "२०२४",
    "status": "accepted"
    // ... all other fields
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "student_id": "STU-0002",
    "full_name": "प्रिया सुनील देशमुख",
    "school_id": 1,
    "school_name": "नगर परिषद प्राथमिक शाळा",
    "school_recognition_no": "4260/37",
    "serial_no": "102",
    "status": "accepted",
    // ... all other fields
  }
}
```

### Get All Students (with pagination and filters)

**GET** `/api/students?page=1&limit=100&status=accepted&school_id=1&search=प्रिया`

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Records per page (default: 100)
- `status` - Filter by status
- `school_id` - Filter by school
- `search` - Search in name, student_id, serial_no, or school name

---

## Field Mapping

### Frontend (camelCase) → Backend (snake_case)

| Frontend | Backend |
|----------|---------|
| `studentFullName` | `full_name` |
| `studentId` | `student_id` |
| `uidAadhaarNumber` | `uid_aadhar_no` |
| `schoolRecognitionNumber` | `school_recognition_no` |
| `serialNumber` | `serial_no` |
| `classTeacherSignature` | `class_teacher_signature` |
| `clerkSignature` | `clerk_signature` |
| `headmasterSignature` | `headmaster_signature` |
| `certificateYear` | `certificate_year` (converts Marathi numerals) |

---

## School Lookup

The system automatically:
1. Looks up school by `school_recognition_no`
2. If not found, creates a new school with available data
3. Associates student with the school via `school_id`

---

## Status Values

- `new` - Newly created, editable
- `in_review` - Submitted for review, editable
- `rejected` - Rejected by reviewer, editable
- `accepted` - Accepted and valid, not editable
- `draft` - Draft status
- `issued` - Certificate issued
- `archived` - Archived
- `cancelled` - Cancelled

---

## Example Usage

### Create Student with Certificate

```bash
curl -X POST http://api.kaamlo.com/api/students/consolidated \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "data": {
      "school_recognition_no": "4260/37",
      "studentId": "STU-0002",
      "studentFullName": "प्रिया सुनील देशमुख",
      "fatherName": "सुनील देशमुख",
      "dateOfBirth": "2011-08-20",
      "serialNumber": "102",
      "leavingDate": "2024-03-25",
      "leavingClass": "आठवी",
      "certificateYear": "२०२४",
      "status": "accepted"
    }
  }'
```

### Get Students with Filters

```bash
curl -X GET "http://api.kaamlo.com/api/students?status=accepted&school_id=1&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Benefits

1. **Simplified Schema**: No need for separate certificates table
2. **Direct Association**: Student directly linked to school
3. **Single Source of Truth**: All data in one place
4. **Easier Queries**: No complex joins needed
5. **Better Performance**: Fewer tables to join

---

## Backward Compatibility

The old `leaving_certificates` table is still present but deprecated. Existing certificate routes will continue to work, but new data should use the consolidated student endpoint.

---

**Last Updated:** 2024



