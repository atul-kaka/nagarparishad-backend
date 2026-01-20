# Nagar Parishad Backend

Backend service for managing Nagar Parishad School Leaving Certificates. This service provides RESTful APIs to store, retrieve, and manage school leaving certificate information online.

## Features

- **School Management**: Create and manage school information
- **Student Management**: Store student personal and academic details
- **Certificate Management**: Generate and manage leaving certificates with full certificate details
- **RESTful API**: Clean API endpoints for all operations
- **PostgreSQL Database**: Reliable data storage with proper relationships

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. **Clone the repository and navigate to the directory**
   ```bash
   cd nagarparishad-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `env.example.txt` to `.env`
   - Update the database credentials in `.env` file:
     ```
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=nagarparishad_db
     DB_USER=postgres
     DB_PASSWORD=your_password
     PORT=3000
     NODE_ENV=development
     ```

4. **Create the database**
   ```bash
   createdb nagarparishad_db
   ```
   Or using psql:
   ```bash
   psql -U postgres
   CREATE DATABASE nagarparishad_db;
   ```

5. **Run database migration**
   ```bash
   npm run migrate
   ```
   This will create all necessary tables (schools, students, leaving_certificates).

## Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000` (or the PORT specified in .env).

## API Endpoints

### Health Check
- `GET /health` - Check if the server is running

### Schools
- `GET /api/schools` - Get all schools
- `GET /api/schools/:id` - Get school by ID
- `POST /api/schools` - Create a new school
- `PUT /api/schools/:id` - Update a school
- `DELETE /api/schools/:id` - Delete a school

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `GET /api/students/search/:identifier` - Search student by Student ID or Aadhar number
- `POST /api/students` - Create a new student
- `PUT /api/students/:id` - Update a student
- `DELETE /api/students/:id` - Delete a student

### Certificates
- `GET /api/certificates` - Get all certificates (supports query params: ?school_id=, ?student_id=, ?status=)
- `GET /api/certificates/:id` - Get certificate by ID (includes full school and student details)
- `GET /api/certificates/school/:schoolId/serial/:serialNo` - Get certificate by serial number
- `POST /api/certificates` - Create a new certificate
- `PUT /api/certificates/:id` - Update a certificate
- `PATCH /api/certificates/:id/status` - Update certificate status (draft/issued/archived)
- `DELETE /api/certificates/:id` - Delete a certificate

## API Request/Response Examples

### Create a School
```json
POST /api/schools
{
  "name": "Late Jatiramji Barve Nagar Parishad Primary School, Ramtek",
  "address": "Ramtek",
  "taluka": "Ramtek",
  "district": "Nagpur",
  "state": "Maharashtra",
  "phone_no": "1234567890",
  "email": "school@example.com",
  "general_register_no": "GR001",
  "udise_no": "UDISE001",
  "board": "Maharashtra State",
  "medium": "Marathi"
}
```

### Create a Student
```json
POST /api/students
{
  "student_id": "STU001",
  "uid_aadhar_no": "123456789012",
  "full_name": "राजेश कुमार",
  "father_name": "राम कुमार",
  "mother_name": "गीता देवी",
  "surname": "शर्मा",
  "date_of_birth": "2010-05-15",
  "nationality": "Indian",
  "mother_tongue": "Marathi",
  "birth_place_village": "Ramtek",
  "birth_place_taluka": "Ramtek",
  "birth_place_district": "Nagpur",
  "birth_place_state": "Maharashtra"
}
```

### Create a Certificate
```json
POST /api/certificates
{
  "school_id": 1,
  "student_id": 1,
  "serial_no": "101",
  "leaving_date": "2024-03-31",
  "leaving_class": "Class 5",
  "admission_date": "2019-06-01",
  "admission_class": "Class 1",
  "progress_in_studies": "Good",
  "conduct": "Excellent",
  "reason_for_leaving": "Transfer to another school",
  "certificate_date": "2024-04-01",
  "certificate_month": "April",
  "certificate_year": 2024
}
```

## Database Schema

The database consists of three main tables:

1. **schools**: Stores school information
2. **students**: Stores student personal information
3. **leaving_certificates**: Stores certificate data with relationships to schools and students

All tables include `created_at` and `updated_at` timestamps for tracking.

## Response Format

All API responses follow this format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## License

ISC
