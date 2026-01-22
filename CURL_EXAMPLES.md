# cURL Examples for Inserting Data

## Prerequisites
Make sure the server is running on `http://localhost:3000` (or your configured PORT).

---

## 1. Create a School

```bash
curl -X POST http://localhost:3000/api/schools \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"स्व. जतिरामजी बर्वे नगर परिषद प्राथमिक शाळा, रामटेक\",
    \"address\": \"रामटेक\",
    \"taluka\": \"रामटेक\",
    \"district\": \"नागपूर\",
    \"state\": \"महाराष्ट्र\",
    \"phone_no\": \"07112234567\",
    \"email\": \"school.ramtek@nagarparishad.gov.in\",
    \"general_register_no\": \"GR001\",
    \"school_recognition_no\": \"REC001\",
    \"udise_no\": \"UDISE001\",
    \"affiliation_no\": \"AFF001\",
    \"board\": \"Maharashtra State\",
    \"medium\": \"Marathi\"
  }"
```

**Save response ID** - You'll need the `id` from the response for creating certificates.

---

## 2. Create a Student

```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d "{
    \"student_id\": \"STU001\",
    \"uid_aadhar_no\": \"123456789012\",
    \"full_name\": \"राजेश कुमार\",
    \"father_name\": \"राम कुमार\",
    \"mother_name\": \"गीता देवी\",
    \"surname\": \"शर्मा\",
    \"nationality\": \"Indian\",
    \"mother_tongue\": \"Marathi\",
    \"religion\": \"Hindu\",
    \"caste\": \"General\",
    \"sub_caste\": \"\",
    \"birth_place_village\": \"रामटेक\",
    \"birth_place_taluka\": \"रामटेक\",
    \"birth_place_district\": \"नागपूर\",
    \"birth_place_state\": \"महाराष्ट्र\",
    \"birth_place_country\": \"India\",
    \"date_of_birth\": \"2010-05-15\",
    \"date_of_birth_words\": \"पंधरा मे दोन हजार दहा\"
  }"
```

**Save response ID** - You'll need the `id` from the response for creating certificates.

---

## 3. Create a Leaving Certificate

Replace `1` and `1` in `school_id` and `student_id` with actual IDs from the previous responses.

```bash
curl -X POST http://localhost:3000/api/certificates \
  -H "Content-Type: application/json" \
  -d "{
    \"school_id\": 1,
    \"student_id\": 1,
    \"serial_no\": \"101\",
    \"previous_school\": \"\",
    \"previous_class\": \"\",
    \"admission_date\": \"2019-06-01\",
    \"admission_class\": \"Class 1\",
    \"progress_in_studies\": \"Good\",
    \"conduct\": \"Excellent\",
    \"leaving_date\": \"2024-03-31\",
    \"leaving_class\": \"Class 5\",
    \"studying_class_and_since\": \"Class 5 since June 2023\",
    \"reason_for_leaving\": \"Transfer to another school\",
    \"remarks\": \"Student has completed primary education successfully\",
    \"general_register_ref\": \"GR001\",
    \"certificate_date\": \"2024-04-01\",
    \"certificate_month\": \"April\",
    \"certificate_year\": 2024,
    \"class_teacher_name\": \"श्रीमती सुनीता पाटिल\",
    \"clerk_name\": \"श्री रवींद्र जोशी\",
    \"headmaster_name\": \"श्री महेश देशमुख\",
    \"status\": \"issued\"
  }"
```

---

## Complete Example: Insert All Data in Sequence

### Step 1: Create School (Note the `id` from response)

```bash
curl -X POST http://localhost:3000/api/schools \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"स्व. जतिरामजी बर्वे नगर परिषद प्राथमिक शाळा, रामटेक\", \"address\": \"रामटेक\", \"taluka\": \"रामटेक\", \"district\": \"नागपूर\", \"state\": \"महाराष्ट्र\", \"phone_no\": \"07112234567\", \"email\": \"school@example.com\", \"general_register_no\": \"GR001\", \"udise_no\": \"UDISE001\", \"board\": \"Maharashtra State\", \"medium\": \"Marathi\"}"
```

**Response example:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "स्व. जतिरामजी बर्वे नगर परिषद प्राथमिक शाळा, रामटेक",
    ...
  }
}
```
**Use `id: 1` for school_id in certificate**

---

### Step 2: Create Student (Note the `id` from response)

```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d "{\"student_id\": \"STU001\", \"uid_aadhar_no\": \"123456789012\", \"full_name\": \"राजेश कुमार\", \"father_name\": \"राम कुमार\", \"mother_name\": \"गीता देवी\", \"surname\": \"शर्मा\", \"nationality\": \"Indian\", \"mother_tongue\": \"Marathi\", \"birth_place_village\": \"रामटेक\", \"birth_place_taluka\": \"रामटेक\", \"birth_place_district\": \"नागपूर\", \"birth_place_state\": \"महाराष्ट्र\", \"date_of_birth\": \"2010-05-15\"}"
```

**Response example:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "full_name": "राजेश कुमार",
    ...
  }
}
```
**Use `id: 1` for student_id in certificate**

---

### Step 3: Create Certificate (Use IDs from above responses)

```bash
curl -X POST http://localhost:3000/api/certificates \
  -H "Content-Type: application/json" \
  -d "{\"school_id\": 1, \"student_id\": 1, \"serial_no\": \"101\", \"admission_date\": \"2019-06-01\", \"admission_class\": \"Class 1\", \"progress_in_studies\": \"Good\", \"conduct\": \"Excellent\", \"leaving_date\": \"2024-03-31\", \"leaving_class\": \"Class 5\", \"reason_for_leaving\": \"Transfer to another school\", \"certificate_date\": \"2024-04-01\", \"certificate_month\": \"April\", \"certificate_year\": 2024, \"status\": \"issued\"}"
```

---

## Windows Command Prompt (Alternative Format)

If the above doesn't work on Windows CMD, use this format:

```cmd
curl -X POST http://localhost:3000/api/schools -H "Content-Type: application/json" -d "{\"name\":\"Test School\",\"district\":\"Nagpur\",\"state\":\"Maharashtra\"}"
```

---

## PowerShell Format (Windows)

```powershell
$body = @{
    name = "स्व. जतिरामजी बर्वे नगर परिषद प्राथमिक शाळा, रामटेक"
    address = "रामटेक"
    taluka = "रामटेक"
    district = "नागपूर"
    state = "महाराष्ट्र"
    phone_no = "07112234567"
    email = "school@example.com"
    general_register_no = "GR001"
    board = "Maharashtra State"
    medium = "Marathi"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/schools" -Method Post -Body $body -ContentType "application/json"
```

---

## Verify Data

### Get All Schools
```bash
curl http://localhost:3000/api/schools
```

### Get All Students
```bash
curl http://localhost:3000/api/students
```

### Get All Certificates
```bash
curl http://localhost:3000/api/certificates
```

### Get Specific Certificate with Full Details
```bash
curl http://localhost:3000/api/certificates/1
```

---

## Notes

- Replace `localhost:3000` with your server address if different
- Replace `1` in school_id and student_id with actual IDs from your responses
- Date format: `YYYY-MM-DD` (e.g., "2024-04-01")
- Required fields must be included or you'll get validation errors
- Check the response to see if the insert was successful



