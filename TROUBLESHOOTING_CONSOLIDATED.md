# Troubleshooting Consolidated Student Endpoint

## Error: "Cannot edit record with status 'accepted'"

### Problem
When trying to create/update a student via `/api/students/consolidated`, you get:
```json
{
  "success": false,
  "error": "Cannot edit record with status \"accepted\". Only draft and rejected records can be edited."
}
```

### Cause
An existing student record with the same `student_id` or `uid_aadhar_no` already exists in the database with status `"accepted"`. The system prevents editing records with final statuses (`accepted`, `in_review`, `issued`, `archived`).

### Solutions

#### Option 1: Use Different Student ID/Aadhar Number (Recommended for new records)
If you're creating a new student, use a unique identifier:

```json
{
  "data": {
    "studentId": "STU-0003",  // Use a different, unique ID
    "uidAadhaarNumber": "234523452346",  // Use a different Aadhar
    ...
  }
}
```

#### Option 2: Change Status of Existing Record First
To edit an existing record with status `"accepted"`:

1. **Use the status update endpoint** to change status to `rejected` or `draft`:
   ```bash
   PATCH /api/students/{id}/status
   {
     "status": "rejected",
     "reason": "Needs correction"
   }
   ```
   Note: Only Super Admin can change status from `accepted` → `rejected` (must go through workflow)

2. **Then update** the record via `/api/students/consolidated`

#### Option 3: Check Existing Record
First, check what exists:
```bash
GET /api/students?student_id=STU-0002
# OR
GET /api/students?uid_aadhar_no=234523452345
```

#### Option 4: Delete and Recreate (Only for Draft/Rejected)
If the existing record is in `draft` or `rejected` status, you can delete it first:
```bash
DELETE /api/students/{id}
```

**Note:** Records with status `accepted` cannot be deleted.

---

## Data Structure Issue (Fixed)

### Problem
Request data is nested in `data` property:
```json
{
  "data": {
    "school_recognition_no": "4260/37",
    ...
  }
}
```

### Solution
The code now handles both formats:
- Nested: `{ "data": {...} }`
- Direct: `{ ... }`

Both will work correctly.

---

## Common Issues

### Issue: School Not Found
```
{
  "success": false,
  "error": "School with recognition number \"4260/37\" not found..."
}
```

**Solution:** Create the school first via `/api/schools` endpoint.

---

### Issue: Missing Required Fields
```
{
  "success": false,
  "error": "full_name is required"
}
```

**Solution:** Ensure `full_name` (or `studentFullName`) and `date_of_birth` (or `dateOfBirth`) are provided.

---

### Issue: Duplicate Identifier
```
{
  "success": false,
  "error": "Student with this ID or Aadhar number already exists"
}
```

**Solution:** Use a different `student_id` or `uid_aadhar_no`, or update the existing record.

---

## Valid Statuses and Editing Rules

| Status | Can Edit | Can Delete | Can Update Status |
|--------|----------|------------|-------------------|
| `draft` | ✅ Yes | ✅ Yes | ✅ Yes |
| `rejected` | ✅ Yes | ✅ Yes | ✅ Yes |
| `in_review` | ❌ No | ❌ No | ✅ Yes (Super Admin only) |
| `accepted` | ❌ No | ❌ No | ✅ Yes (Super Admin only) |
| `issued` | ❌ No | ❌ No | ✅ Yes (Super Admin only) |
| `archived` | ❌ No | ❌ No | ❌ No |
| `cancelled` | ❌ No | ❌ No | ❌ No |

---

## Example: Creating New Student

```bash
curl -X POST 'http://localhost:3000/api/students/consolidated' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "data": {
      "schoolRecognitionNumber": "4260/37",
      "studentId": "STU-0003",
      "uidAadhaarNumber": "234523452346",
      "studentFullName": "प्रिया सुनील देशमुख",
      "dateOfBirth": "2011-08-20",
      "status": "draft",
      ...
    }
  }'
```

---

## Example: Updating Existing Draft Record

```bash
curl -X POST 'http://localhost:3000/api/students/consolidated' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "data": {
      "studentId": "STU-0002",  # Existing draft record
      "studentFullName": "Updated Name",
      "status": "draft",
      ...
    }
  }'
```

---

## Status Workflow

```
draft → in_review → accepted → issued/archived
  ↓        ↓
rejected ← ┘
```

**To edit an accepted record:**
1. Change status: `accepted` → `rejected` (Super Admin only)
2. Then edit the record
3. Resubmit: `rejected` → `in_review`
4. Approve: `in_review` → `accepted`



