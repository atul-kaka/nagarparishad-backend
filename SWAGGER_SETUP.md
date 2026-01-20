# Swagger API Documentation Setup

## Overview

Swagger/OpenAPI documentation has been set up for all API endpoints. You can now view and test all APIs through an interactive UI.

---

## Access Swagger UI

### Local Development
```
http://localhost:3000/api-docs
```

### Production
```
https://api.kaamlo.com/api-docs
```

---

## Installation

### Step 1: Install Dependencies

```bash
npm install
```

This will install:
- `swagger-jsdoc` - For generating OpenAPI specification from JSDoc comments
- `swagger-ui-express` - For serving Swagger UI

### Step 2: Start Server

```bash
npm start
# or
npm run dev
```

### Step 3: Open Swagger UI

Open your browser and navigate to:
```
http://localhost:3000/api-docs
```

---

## What's Documented

### All API Endpoints

✅ **Health Check**
- `GET /health` - Health check

✅ **Schools**
- `GET /api/schools` - Get all schools
- `GET /api/schools/:id` - Get school by ID
- `POST /api/schools` - Create school
- `PUT /api/schools/:id` - Update school
- `DELETE /api/schools/:id` - Delete school

✅ **Students**
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `GET /api/students/search/:identifier` - Search by Student ID or Aadhar
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

✅ **Certificates**
- `GET /api/certificates` - Get all certificates (with filters)
- `GET /api/certificates/:id` - Get certificate by ID
- `GET /api/certificates/school/:schoolId/serial/:serialNo` - Get by serial number
- `POST /api/certificates` - Create certificate
- `PUT /api/certificates/:id` - Update certificate
- `PATCH /api/certificates/:id/status` - Update status with audit
- `GET /api/certificates/:id/status-history` - Get status history
- `DELETE /api/certificates/:id` - Delete certificate

✅ **Users**
- `POST /api/users/register` - Register new user
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user

✅ **Audit**
- `GET /api/audit` - Get audit logs (with filters)
- `GET /api/audit/:table_name/:record_id` - Get logs for specific record

---

## Features

### Interactive API Testing

1. **Try It Out** - Click "Try it out" on any endpoint
2. **Fill Parameters** - Enter required parameters
3. **Execute** - Click "Execute" to send request
4. **View Response** - See the actual API response

### Schema Documentation

All request/response schemas are documented:
- School schema
- Student schema
- LeavingCertificate schema
- User schema
- AuditLog schema
- Error responses

### Example Values

All endpoints include example values for:
- Request bodies
- Query parameters
- Path parameters
- Response data

---

## Using Swagger UI

### 1. View All Endpoints

All endpoints are organized by tags:
- Health
- Schools
- Students
- Certificates
- Users
- Audit

### 2. Test an Endpoint

1. Expand an endpoint (e.g., "POST /api/schools")
2. Click **"Try it out"**
3. Fill in the request body:
   ```json
   {
     "name": "Test School",
     "district": "Nagpur",
     "state": "Maharashtra"
   }
   ```
4. Click **"Execute"**
5. View the response below

### 3. View Schema

Click on any schema name (e.g., "School") to see:
- All fields
- Data types
- Required fields
- Example values

---

## Example: Create a School via Swagger

1. Go to `http://localhost:3000/api-docs`
2. Find **"POST /api/schools"** under Schools tag
3. Click **"Try it out"**
4. Enter request body:
   ```json
   {
     "name": "स्व. जतिरामजी बर्वे नगर परिषद प्राथमिक शाळा, रामटेक",
     "address": "रामटेक",
     "taluka": "रामटेक",
     "district": "नागपूर",
     "state": "महाराष्ट्र",
     "phone_no": "07112234567",
     "email": "school@example.com",
     "general_register_no": "GR001",
     "udise_no": "UDISE001",
     "board": "Maharashtra State",
     "medium": "Marathi"
   }
   ```
5. Click **"Execute"**
6. See the response with created school data

---

## Export OpenAPI Spec

You can export the OpenAPI specification:

### Get JSON Spec

```bash
curl http://localhost:3000/api-docs.json
```

### Get YAML Spec

The spec is available in `config/swagger.js`. You can export it programmatically.

---

## Customization

### Change Swagger UI Theme

Edit `server.js`:
```javascript
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Nagar Parishad API Documentation',
  customfavIcon: '/favicon.ico' // Add your favicon
}));
```

### Add Authentication

If you add JWT authentication later, update `config/swagger.js`:
```javascript
components: {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    }
  }
}
```

---

## Troubleshooting

### Swagger UI Not Loading

1. Check if dependencies are installed: `npm list swagger-ui-express swagger-jsdoc`
2. Check server logs for errors
3. Verify route is registered: `app.use('/api-docs', ...)`

### Endpoints Not Showing

1. Check JSDoc comments are in route files
2. Verify `apis` path in `config/swagger.js` matches your route files
3. Restart server after adding new endpoints

### Schema Not Displaying

1. Check schema definitions in `config/swagger.js`
2. Verify schema references in route annotations match component names

---

## Next Steps

- ✅ Swagger UI is ready at `/api-docs`
- ✅ All endpoints are documented
- ✅ Interactive testing available
- ⚠️ Add authentication (JWT) if needed
- ⚠️ Add more detailed examples
- ⚠️ Export OpenAPI spec for API clients

Your API documentation is now live and interactive!

