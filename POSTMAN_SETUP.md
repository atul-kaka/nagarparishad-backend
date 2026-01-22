# Postman Collection Setup Guide

## Import Collection

1. **Download the Collection**
   - File: `Nagar_Parishad_API.postman_collection.json`

2. **Import into Postman**
   - Open Postman
   - Click "Import" button (top left)
   - Select `Nagar_Parishad_API.postman_collection.json`
   - Click "Import"

---

## Setup Environment Variables

### Option 1: Create Environment in Postman

1. Click "Environments" (left sidebar)
2. Click "+" to create new environment
3. Name it: "Nagar Parishad API"
4. Add variables:

| Variable | Initial Value | Current Value |
|----------|--------------|---------------|
| `base_url` | `http://localhost:3000` | `http://api.kaamlo.com` |
| `auth_token` | (leave empty) | (leave empty) |

5. Click "Save"
6. Select this environment from the dropdown (top right)

### Option 2: Use Collection Variables

The collection already has variables defined:
- `base_url` - Default: `http://localhost:3000`
- `auth_token` - Auto-set after login (via test scripts)

**To change base_url:**
- Right-click collection → Edit
- Go to "Variables" tab
- Update `base_url` value

---

## Authentication Flow

### Step 1: Login
1. Go to **Authentication → Login**
2. Update username/password in request body
3. Click "Send"
4. The token will be **automatically saved** to `auth_token` variable

### Step 2: Use Authenticated Requests
All protected endpoints will automatically use the `auth_token` variable

### Token Refresh
- Token expires in 15 minutes
- Use **Authentication → Token Refresh** to get new token
- New token is automatically saved

---

## Collection Structure

### 📁 Authentication
- Register, Login, OTP, Logout, Password Reset, Token Refresh

### 📁 Schools
- CRUD operations for schools

### 📁 Students
- Get, Create, Update, Delete students
- Create consolidated student with certificate data
- Update student status with comments

### 📁 Certificates
- CRUD operations for certificates
- Bulk create certificates

### 📁 Audit
- View audit logs and record history

### 📁 Users
- User management endpoints

### 📁 Health
- Health check and API info

---

## Quick Start

1. **Set base_url**
   - For local: `http://localhost:3000`
   - For production: `http://api.kaamlo.com`

2. **Login**
   - Go to **Authentication → Login**
   - Enter credentials
   - Token is automatically saved

3. **Start Testing**
   - All other endpoints will use the saved token

---

## Features

### ✅ Auto-Token Management
- Login requests automatically save token to `auth_token` variable
- Token refresh automatically updates the token
- No manual copy-paste needed!

### ✅ Pre-configured Examples
- All requests have example request bodies
- Ready to use with real data

### ✅ Organized Structure
- Endpoints grouped logically
- Easy to find what you need

### ✅ Environment Support
- Works with different environments (dev, staging, prod)
- Just change `base_url` variable

---

## Common Use Cases

### Create a Student with Certificate Data
1. **Authentication → Login** (to get token)
2. **Schools → Get All Schools** (to find school_id)
3. **Students → Create Student Consolidated** (with all data)

### Update Student Status
1. **Authentication → Login**
2. **Students → Update Student Status**
3. Include `comment` field in request body

### Search for Student
1. **Students → Search Student**
2. Use student_id or Aadhar number as identifier

---

## Notes

- **Token Expiry**: Tokens expire in 15 minutes
- **Auto-Refresh**: Use "Token Refresh" endpoint when token expires
- **Roles**: Different roles (user, admin, super) have different permissions
- **Status Updates**: Only certain status transitions are allowed (see STATUS_WORKFLOW.md)

---

## Troubleshooting

### Token Not Working
- Check if token expired (15 minutes)
- Use **Authentication → Token Refresh**
- Or login again

### 401 Unauthorized
- Make sure you're logged in
- Check if `auth_token` variable is set
- Verify Authorization header is present

### 403 Forbidden
- Check your role has permission for the action
- Admin can edit/create students
- Super Admin can approve/reject

---

Enjoy testing the API! 🚀


