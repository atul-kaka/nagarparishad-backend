# Quick Fix: Duplicate Aadhar Number Issue

## Problem
Trying to create `STU-0005` but Aadhar `234523452345` already exists for `STU-0002` with status `"accepted"`.

## Solution

### If Same Person (Typo Correction)
Use Super Admin to change status, then update:

```bash
# Step 1: Change status (Super Admin)
PATCH /api/students/1/status
{
  "status": "rejected",
  "reason": "Updating student_id"
}

# Step 2: Update record
POST /api/students/consolidated
{
  "studentId": "STU-0005",
  "uidAadhaarNumber": "234523452345",
  ...
}
```

### If Different Person
Use a different Aadhar number:
```json
{
  "studentId": "STU-0005",
  "uidAadhaarNumber": "234523452346",  # Different Aadhar
  ...
}
```

## Verify Record Exists
```sql
SELECT * FROM students WHERE uid_aadhar_no = '234523452345';
```



