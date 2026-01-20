# Permissions and Access Control Summary

## Overview

This document outlines the role-based permissions for student record management, including create, edit, delete, and status update operations.

---

## Role Definitions

### **Admin**
- Can create student records
- Can edit draft/rejected records
- Can delete draft/rejected records
- Can submit records for review (draft → in_review)
- Can resubmit rejected records (rejected → in_review)

### **Super Admin**
- Can approve records (in_review → accepted)
- Can reject records (in_review → rejected)
- Can issue certificates (accepted → issued)
- Can archive records (accepted → archived)
- **Cannot** create/edit/delete student records (Admin only)
- **Cannot** submit for review (Admin only)

### **User (Read-only)**
- Can only view records with status `accepted`
- Cannot create, edit, or delete any records

---

## Edit/Delete Permissions by Status

### ✅ **Editable/Deletable Statuses**
- **draft** - Can be edited and deleted by Admin
- **rejected** - Can be edited and deleted by Admin

### ❌ **Non-Editable/Non-Deletable Statuses**
- **in_review** - Cannot be edited or deleted (must be approved/rejected first)
- **accepted** - Cannot be edited or deleted (final approved state)
- **issued** - Cannot be edited or deleted (final state)
- **archived** - Cannot be edited or deleted (final state)
- **cancelled** - Cannot be edited or deleted (final state)

---

## API Endpoint Permissions

### **Create Student**
- **Endpoint:** `POST /api/students` or `POST /api/students/consolidated`
- **Required Role:** Admin only
- **Default Status:** `draft`
- **Authentication:** Required

**Example:**
```bash
curl -X POST http://api.kaamlo.com/api/students/consolidated \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data": {...}}'
```

**Error (Non-Admin):**
```json
{
  "success": false,
  "error": "Only Admin can create student records"
}
```

---

### **Update Student**
- **Endpoint:** `PUT /api/students/{id}` or `POST /api/students/consolidated` (if exists)
- **Required Role:** Admin only
- **Status Restriction:** Only `draft` and `rejected` records can be edited
- **Authentication:** Required

**Example:**
```bash
curl -X PUT http://api.kaamlo.com/api/students/1 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Updated Name", ...}'
```

**Error (Non-Editable Status):**
```json
{
  "success": false,
  "error": "Cannot edit record with status \"accepted\". Only draft and rejected records can be edited."
}
```

**Error (Non-Admin):**
```json
{
  "success": false,
  "error": "Only Admin can edit student records"
}
```

---

### **Delete Student**
- **Endpoint:** `DELETE /api/students/{id}`
- **Required Role:** Admin only
- **Status Restriction:** Only `draft` and `rejected` records can be deleted
- **Authentication:** Required

**Example:**
```bash
curl -X DELETE http://api.kaamlo.com/api/students/1 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Error (Non-Deletable Status):**
```json
{
  "success": false,
  "error": "Cannot delete record with status \"accepted\". Only draft and rejected records can be deleted. Approved records cannot be deleted."
}
```

**Error (Non-Admin):**
```json
{
  "success": false,
  "error": "Only Admin can delete student records"
}
```

---

### **Submit for Review**
- **Endpoint:** `PATCH /api/students/{id}/status`
- **Required Role:** Admin only
- **Transition:** `draft` → `in_review` or `rejected` → `in_review`
- **Authentication:** Required

**Example:**
```bash
curl -X PATCH http://api.kaamlo.com/api/students/1/status \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_review", "reason": "Submitted for review"}'
```

**Error (Non-Admin):**
```json
{
  "success": false,
  "error": "Only Admin can submit records for review"
}
```

---

### **Approve/Reject Record**
- **Endpoint:** `PATCH /api/students/{id}/status`
- **Required Role:** Super Admin only
- **Transitions:** `in_review` → `accepted` or `in_review` → `rejected`
- **Authentication:** Required

**Example (Approve):**
```bash
curl -X PATCH http://api.kaamlo.com/api/students/1/status \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "accepted", "reason": "All documents verified"}'
```

**Example (Reject):**
```bash
curl -X PATCH http://api.kaamlo.com/api/students/1/status \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "rejected", "reason": "Missing required documents"}'
```

**Error (Non-Super Admin):**
```json
{
  "success": false,
  "error": "Only Super Admin can approve or reject records"
}
```

---

## Workflow Examples

### Example 1: Create and Submit for Review

1. **Admin creates student** → Status: `draft`
2. **Admin edits student** (if needed) → Status: `draft` (still editable)
3. **Admin submits for review** → Status: `draft` → `in_review`
4. **Super Admin approves** → Status: `in_review` → `accepted`
5. **Record is now locked** → Cannot be edited or deleted

### Example 2: Rejection and Resubmission

1. **Admin creates student** → Status: `draft`
2. **Admin submits for review** → Status: `draft` → `in_review`
3. **Super Admin rejects** → Status: `in_review` → `rejected`
4. **Admin edits student** (fixes issues) → Status: `rejected` (editable)
5. **Admin resubmits for review** → Status: `rejected` → `in_review`
6. **Super Admin approves** → Status: `in_review` → `accepted`

### Example 3: Attempted Invalid Operations

1. **Admin creates student** → Status: `draft`
2. **Admin tries to approve directly** → ❌ Error: "Cannot transition from 'draft' to 'accepted'"
3. **Admin tries to delete accepted record** → ❌ Error: "Cannot delete record with status 'accepted'"
4. **User tries to edit draft record** → ❌ Error: "Only Admin can edit student records"

---

## Status State Machine

```
                    [draft] ← Admin can edit/delete
                      |
                      | (Admin submits)
                      v
                 [in_review] ← Cannot edit/delete
                      |
         +------------+------------+
         |                         |
         | (Super Admin)           | (Super Admin)
         v                         v
    [rejected] ← Admin can edit/delete
         |                         |
         | (Admin resubmits)       | (Super Admin issues)
         +---------> [in_review]    |
                              [accepted] ← Cannot edit/delete
                                  |
                                  | (Super Admin)
                                  v
                              [issued] ← Cannot edit/delete
```

---

## Summary Table

| Operation | Admin | Super Admin | User |
|-----------|-------|-------------|------|
| Create student | ✅ | ❌ | ❌ |
| Edit draft/rejected | ✅ | ❌ | ❌ |
| Edit accepted/in_review | ❌ | ❌ | ❌ |
| Delete draft/rejected | ✅ | ❌ | ❌ |
| Delete accepted/in_review | ❌ | ❌ | ❌ |
| Submit for review | ✅ | ❌ | ❌ |
| Approve/Reject | ❌ | ✅ | ❌ |
| View accepted | ✅ | ✅ | ✅ |
| View all statuses | ✅ | ✅ | ❌ |

---

## Key Rules

1. ✅ **Only Admin can create/edit/delete student records**
2. ✅ **Only draft and rejected records can be edited/deleted**
3. ✅ **Only Admin can submit records for review**
4. ✅ **Only Super Admin can approve/reject records**
5. ✅ **Approved records cannot be edited or deleted**
6. ✅ **Records in review cannot be edited or deleted**

---

**Last Updated:** 2024

