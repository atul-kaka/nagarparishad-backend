# Handling Duplicate Student Records

## Scenario: Trying to Create Student with Existing Aadhar/Student ID

### Error Message
```json
{
  "success": false,
  "error": "A student record already exists with this Aadhar Number.",
  "existingRecord": {
    "id": 1,
    "student_id": "STU-0002",
    "uid_aadhar_no": "234523452345",
    "full_name": "प्रिया सुनील देशमुख",
    "status": "accepted"
  },
  "hint": "Student ID and Aadhar Number must be unique. Use a different Aadhar number or update the existing record if needed."
}
```

---

## Solution 1: Different Person - Use Different Aadhar

If `STU-0003` is a **different person** than `STU-0002`, use a **different Aadhar number**:

```bash
POST /api/students/consolidated
{
  "studentId": "STU-0003",
  "uidAadhaarNumber": "234523452346",  # Different Aadhar
  "studentFullName": "Different Person Name",
  ...
}
```

✅ **Result:** New student record created

---

## Solution 2: Same Person - Update Existing Record

If `STU-0003` is the **same person** as `STU-0002`, you need to **update the existing record**.

### Step 1: Change Status (Super Admin Required)

Since the existing record has status `"accepted"`, you must first change it to `"rejected"` or `"draft"`:

```bash
PATCH /api/students/1/status
Authorization: Bearer <SUPER_ADMIN_TOKEN>
Content-Type: application/json

{
  "status": "rejected",
  "reason": "Record needs correction - updating student ID"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Status updated successfully",
  "data": {
    "id": 1,
    "status": "rejected",
    ...
  }
}
```

### Step 2: Update the Record

Now update with the new data:

```bash
POST /api/students/consolidated
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "studentId": "STU-0003",  # Can update student_id
  "uidAadhaarNumber": "234523452345",  # Same Aadhar (must match)
  "studentFullName": "Updated Name",
  "status": "draft",
  ...
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "student_id": "STU-0003",  # Updated
    "uid_aadhar_no": "234523452345",
    "status": "draft",
    ...
  }
}
```

### Step 3: Resubmit for Review (Optional)

After updating, resubmit for review:

```bash
PATCH /api/students/1/status
{
  "status": "in_review",
  "reason": "Updated record resubmitted for review"
}
```

✅ **Result:** Existing record updated with new student ID and data

---

## Solution 3: Delete and Recreate (Only for Draft/Rejected)

If the existing record has status `"draft"` or `"rejected"`, you can delete it:

```bash
DELETE /api/students/1
Authorization: Bearer <ADMIN_TOKEN>
```

**Then create the new record:**
```bash
POST /api/students/consolidated
{
  "studentId": "STU-0003",
  "uidAadhaarNumber": "234523452345",
  ...
}
```

❌ **Note:** Cannot delete records with status `"accepted"`, `"in_review"`, `"issued"`, or `"archived"`.

---

## Status Workflow Reference

```
draft → in_review → accepted → issued/archived
  ↓        ↓
rejected ← ┘
```

### Who Can Change Status

| From → To | Admin | Super Admin |
|-----------|-------|-------------|
| `draft` → `in_review` | ✅ | ✅ |
| `in_review` → `accepted` | ❌ | ✅ |
| `in_review` → `rejected` | ❌ | ✅ |
| `accepted` → `rejected` | ❌ | ✅ |
| `rejected` → `in_review` | ✅ | ✅ |
| `rejected` → `draft` | ❌ | ❌ (must go through in_review) |

---

## Quick Decision Tree

```
Is the Aadhar number the same?
├─ YES → Is it the same person?
│   ├─ YES → Update existing record (Solution 2)
│   └─ NO → ERROR: Aadhar numbers must be unique per person
└─ NO → Create new record (Solution 1)
```

---

## Common Scenarios

### Scenario 1: Typo in Student ID
**Problem:** Created `STU-0002` but meant `STU-0003` (same person)  
**Solution:** Use Solution 2 - Update existing record

### Scenario 2: Same Person, Different School
**Problem:** Same person transferring schools  
**Solution:** Update existing record with new school_id

### Scenario 3: Duplicate Entry by Mistake
**Problem:** Accidentally created duplicate (same person, different student_id)  
**Solution:** 
- If status is `draft`/`rejected`: Delete one (Solution 3)
- If status is `accepted`: Contact Super Admin to change status first (Solution 2)

### Scenario 4: Different Person, Same Aadhar (Data Entry Error)
**Problem:** Two different people assigned same Aadhar number  
**Solution:** 
- Verify Aadhar numbers are correct
- Use different Aadhar numbers (Solution 1)
- This should be rare - Aadhar numbers are unique per person

---

## API Endpoints Reference

### Check Existing Record
```bash
GET /api/students?student_id=STU-0002
GET /api/students?uid_aadhar_no=234523452345
```

### Update Status
```bash
PATCH /api/students/{id}/status
{
  "status": "rejected",
  "reason": "Reason for status change"
}
```

### Delete Record (Only Draft/Rejected)
```bash
DELETE /api/students/{id}
```

### Create/Update Record
```bash
POST /api/students/consolidated
{
  "studentId": "...",
  "uidAadhaarNumber": "...",
  ...
}
```

---

## Notes

1. **Aadhar Number Uniqueness:** Enforced at database level - cannot have duplicates
2. **Student ID Uniqueness:** Enforced at database level - cannot have duplicates  
3. **Accepted Records:** Cannot be edited or deleted - must change status first
4. **Admin Role:** Can create and edit draft/rejected records
5. **Super Admin Role:** Can change status and edit accepted records


