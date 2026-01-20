# Status Workflow Documentation

## Overview

The system implements a proper state machine for certificate/student status management. Records must follow a defined workflow and cannot skip states.

---

## Status States

1. **draft** - Initial state when record is created (default)
2. **in_review** - Record submitted for review
3. **rejected** - Record rejected by reviewer
4. **accepted** - Record approved by reviewer
5. **issued** - Certificate issued (final)
6. **archived** - Record archived (final)
7. **cancelled** - Record cancelled (final)

---

## State Machine Rules

### Valid Transitions

```
draft → in_review, cancelled
in_review → rejected, accepted, cancelled
rejected → in_review, cancelled
accepted → issued, archived
issued → archived
archived → (final state, no transitions)
cancelled → (final state, no transitions)
```

### Invalid Transitions (Blocked)

- ❌ `draft` → `accepted` (must go through review)
- ❌ `draft` → `rejected` (must go through review)
- ❌ `draft` → `issued` (must go through review and acceptance)
- ❌ `in_review` → `draft` (cannot go back)
- ❌ `accepted` → `rejected` (cannot undo acceptance)
- ❌ `rejected` → `accepted` (must resubmit for review first)

---

## Role-Based Permissions

### Admin & Super Admin
- Can submit records for review: `draft` → `in_review`
- Can resubmit rejected records: `rejected` → `in_review`

### Super Admin Only
- Can approve records: `in_review` → `accepted`
- Can reject records: `in_review` → `rejected`
- Can issue certificates: `accepted` → `issued`
- Can archive records: `accepted` → `archived`

### User (Read-only)
- Can only view records with status `accepted`

---

## API Endpoints

### 1. Update Status

**PATCH** `/api/students/{id}/status`

Update student/certificate status with state machine validation.

**Authentication:** Required  
**Authorization:** Based on role and transition

**Request:**
```json
{
  "status": "in_review",
  "reason": "Submitted for review",
  "notes": "All documents verified"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Status updated from draft to in_review",
  "data": {
    "id": 1,
    "status": "in_review",
    ...
  }
}
```

**Error (Invalid Transition):**
```json
{
  "success": false,
  "error": "Cannot transition from \"draft\" to \"accepted\". Valid transitions from \"draft\" are: in_review, cancelled"
}
```

**Error (Unauthorized):**
```json
{
  "success": false,
  "error": "Only Super Admin can approve or reject records"
}
```

---

### 2. Get Allowed Transitions

**GET** `/api/students/{id}/status/transitions`

Get current status and allowed transitions for a student.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "current_status": "draft",
    "allowed_transitions": ["in_review", "cancelled"],
    "can_edit": true,
    "is_final_state": false
  }
}
```

---

## Workflow Examples

### Example 1: Normal Approval Flow

1. **Create Student** → Status: `draft` (default)
2. **Admin submits for review** → Status: `draft` → `in_review`
3. **Super Admin approves** → Status: `in_review` → `accepted`
4. **Super Admin issues certificate** → Status: `accepted` → `issued`

### Example 2: Rejection and Resubmission

1. **Create Student** → Status: `draft`
2. **Admin submits for review** → Status: `draft` → `in_review`
3. **Super Admin rejects** → Status: `in_review` → `rejected`
4. **Admin fixes issues and resubmits** → Status: `rejected` → `in_review`
5. **Super Admin approves** → Status: `in_review` → `accepted`

### Example 3: Invalid Direct Approval (Blocked)

1. **Create Student** → Status: `draft`
2. **Try to approve directly** → ❌ Error: "Cannot transition from 'draft' to 'accepted'"

---

## Usage Examples

### Submit for Review

```bash
curl -X PATCH http://api.kaamlo.com/api/students/1/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_review",
    "reason": "All documents verified and ready for review"
  }'
```

### Approve Record (Super Admin Only)

```bash
curl -X PATCH http://api.kaamlo.com/api/students/1/status \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "accepted",
    "reason": "All documents verified and approved",
    "notes": "Certificate ready for issue"
  }'
```

### Reject Record (Super Admin Only)

```bash
curl -X PATCH http://api.kaamlo.com/api/students/1/status \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "rejected",
    "reason": "Missing required documents",
    "notes": "Please provide birth certificate"
  }'
```

### Get Allowed Transitions

```bash
curl -X GET http://api.kaamlo.com/api/students/1/status/transitions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Editable States

Records can only be edited when status is:
- `draft`
- `in_review`
- `rejected`

Records with status `accepted`, `issued`, `archived`, or `cancelled` cannot be edited.

---

## Final States

Once a record reaches these states, it cannot be changed:
- `archived`
- `cancelled`

---

## Status History

All status changes are logged in:
- `certificate_status_history` table (if exists)
- `audit_logs` table

Each status change includes:
- Old status
- New status
- Changed by (user ID)
- Reason
- Notes
- Timestamp

---

## Frontend Integration

### Check Allowed Transitions

```javascript
// Get allowed transitions for current record
const response = await fetch(`/api/students/${studentId}/status/transitions`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await response.json();

// Show only allowed status buttons
data.allowed_transitions.forEach(status => {
  // Show button for this status
});

// Disable edit if not editable
if (!data.can_edit) {
  // Disable edit form
}
```

### Update Status

```javascript
async function updateStatus(studentId, newStatus, reason, notes) {
  const response = await fetch(`/api/students/${studentId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: newStatus,
      reason: reason,
      notes: notes
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    // Show error message (e.g., invalid transition)
    alert(error.error);
    return;
  }
  
  return await response.json();
}
```

---

## State Machine Diagram

```
                    [draft]
                      |
                      | (Admin/Super Admin)
                      v
                 [in_review]
                      |
         +------------+------------+
         |                         |
         | (Super Admin)           | (Super Admin)
         v                         v
    [rejected]                [accepted]
         |                         |
         | (Admin/Super Admin)     | (Super Admin)
         +---------> [in_review]   |
                              [issued]
                                  |
                                  | (Super Admin)
                                  v
                              [archived]
```

---

**Last Updated:** 2024

