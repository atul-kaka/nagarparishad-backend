# Student API Usage Guide

This guide explains how to use the Student search and retrieval APIs.

## Table of Contents
1. [Get All Students (GET)](#get-all-students)
2. [Search Students (POST)](#search-students-post)
3. [Get Student by ID](#get-student-by-id)
4. [Search Student by Identifier](#search-student-by-identifier)

---

## Get All Students (GET)

**Endpoint:** `GET /api/students`

### Basic Usage

```bash
# Get all students with pagination
GET /api/students?page=1&limit=20
```

### Filter Examples

#### 1. Filter by Status
```bash
GET /api/students?status=active
GET /api/students?status=draft
GET /api/students?status=in_review
```

#### 2. Filter by School
```bash
# By school ID
GET /api/students?school_id=1

# By school name (partial match)
GET /api/students?school_name=नगर परिषद

# By school recognition number
GET /api/students?school_recognition_no=4260/37

# By UDISE number
GET /api/students?udise_no=27090100102

# By any school identifier (searches in name, recognition_no, udise_no, etc.)
GET /api/students?school_identifier=4260/37
```

#### 3. Filter by Student Details
```bash
# By student name (partial match)
GET /api/students?student_name=प्रिया
GET /api/students?full_name=प्रिया  # same as student_name

# By student ID (exact match)
GET /api/students?student_id=STU-0002

# By Aadhaar number (exact match)
GET /api/students?aadhaar=234523452345
GET /api/students?uid_aadhar_no=234523452345  # same as aadhaar
GET /api/students?aadhar=234523452345  # same as aadhaar

# By father's name (partial match)
GET /api/students?father_name=सुनील
```

#### 4. Filter by Dates
```bash
# Exact date of birth
GET /api/students?date_of_birth=2011-08-20

# Date of birth range
GET /api/students?date_of_birth_from=2010-01-01&date_of_birth_to=2012-12-31

# Exact leaving date
GET /api/students?leaving_date=2024-03-25
GET /api/students?date_of_leaving=2024-03-25  # alias for leaving_date

# Leaving date range
GET /api/students?leaving_date_from=2024-01-01&leaving_date_to=2024-12-31
GET /api/students?date_of_leaving_from=2024-01-01&date_of_leaving_to=2024-12-31  # aliases
```

#### 5. Filter by Location
```bash
# By district
GET /api/students?district=नागपूर

# By taluka
GET /api/students?taluka=रामटेक
```

#### 6. Filter by Certificate Details
```bash
# By certificate year
GET /api/students?certificate_year=2024

# By serial number
GET /api/students?serial_no=102

# By leaving class
GET /api/students?leaving_class=आठवी
```

#### 7. Filter by Other Fields
```bash
# By caste
GET /api/students?caste=मराठा

# By religion
GET /api/students?religion=हिंदू

# By creator user ID
GET /api/students?created_by=1
```

#### 8. General Search
```bash
# Searches across: student name, student_id, Aadhaar, serial_no, father_name, mother_name, surname, school name, recognition_no, udise_no
GET /api/students?search=प्रिया
GET /api/students?search=234523452345
GET /api/students?search=STU-0002
```

### Sorting

```bash
# Sort by leaving date (descending - newest first)
GET /api/students?sort_by=leaving_date&sort_order=DESC

# Sort by student name (ascending - A to Z)
GET /api/students?sort_by=full_name&sort_order=ASC

# Sort by date of birth (ascending - oldest first)
GET /api/students?sort_by=date_of_birth&sort_order=ASC

# Sort by certificate year (descending)
GET /api/students?sort_by=certificate_year&sort_order=DESC
```

**Available sort fields:**
- `created_at` (default)
- `updated_at`
- `full_name`
- `student_id`
- `date_of_birth`
- `leaving_date` or `date_of_leaving`
- `certificate_year`
- `status`
- `serial_no`

**Sort orders:**
- `ASC` - Ascending (A-Z, oldest first, etc.)
- `DESC` - Descending (Z-A, newest first, etc.) - default

### Combined Filters Example

```bash
# Complex query with multiple filters and sorting
GET /api/students?page=1&limit=20&status=active&school_id=1&district=नागपूर&date_of_birth_from=2010-01-01&date_of_birth_to=2012-12-31&sort_by=leaving_date&sort_order=DESC
```

### Response Format

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_id": "STU-0002",
      "full_name": "प्रिया सुनील देशमुख",
      "father_name": "सुनील देशमुख",
      "date_of_birth": "2011-08-20",
      "leaving_date": "2024-03-25",
      "status": "active",
      "school_name": "नगर परिषद प्राथमिक शाळा",
      "school_recognition_no": "4260/37",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

---

## Search Students (POST)

**Endpoint:** `POST /api/students/search`

Use this endpoint when you have many filter criteria that would make the GET query string too long.

### Basic Request

```json
POST /api/students/search
Content-Type: application/json

{
  "page": 1,
  "limit": 20,
  "sort_by": "leaving_date",
  "sort_order": "DESC",
  "filters": {
    "status": "active",
    "school_id": 1
  }
}
```

### Advanced Filter Example

```json
POST /api/students/search
Content-Type: application/json

{
  "page": 1,
  "limit": 20,
  "sort_by": "leaving_date",
  "sort_order": "DESC",
  "filters": {
    "status": "active",
    "school_id": 1,
    "district": "नागपूर",
    "taluka": "रामटेक",
    "student_name": "प्रिया",
    "aadhaar": "234523452345",
    "date_of_birth_from": "2010-01-01",
    "date_of_birth_to": "2012-12-31",
    "date_of_leaving_from": "2024-01-01",
    "date_of_leaving_to": "2024-12-31",
    "certificate_year": 2024,
    "caste": "मराठा",
    "religion": "हिंदू",
    "leaving_class": "आठवी"
  }
}
```

### All Available Filter Fields

```json
{
  "filters": {
    // School filters
    "school_id": 1,
    "school_name": "नगर परिषद",
    "school_recognition_no": "4260/37",
    "udise_no": "27090100102",
    "school_identifier": "4260/37",
    "district": "नागपूर",
    "taluka": "रामटेक",
    
    // Student filters
    "student_id": "STU-0002",
    "uid_aadhar_no": "234523452345",
    "aadhaar": "234523452345",  // alias
    "aadhar": "234523452345",   // alias
    "full_name": "प्रिया",
    "student_name": "प्रिया",   // alias
    "father_name": "सुनील",
    "status": "active",
    
    // Date filters
    "date_of_birth": "2011-08-20",
    "date_of_birth_from": "2010-01-01",
    "date_of_birth_to": "2012-12-31",
    "leaving_date": "2024-03-25",
    "date_of_leaving": "2024-03-25",  // alias
    "leaving_date_from": "2024-01-01",
    "date_of_leaving_from": "2024-01-01",  // alias
    "leaving_date_to": "2024-12-31",
    "date_of_leaving_to": "2024-12-31",  // alias
    
    // Certificate filters
    "certificate_year": 2024,
    "serial_no": "102",
    "leaving_class": "आठवी",
    
    // Other filters
    "caste": "मराठा",
    "religion": "हिंदू",
    "created_by": 1,
    "created_at_from": "2024-01-01T00:00:00Z",
    "created_at_to": "2024-12-31T23:59:59Z",
    "updated_at_from": "2024-01-01T00:00:00Z",
    "updated_at_to": "2024-12-31T23:59:59Z",
    
    // General search
    "search": "प्रिया"
  }
}
```

### Response Format

Same as GET endpoint - returns paginated results with the same structure.

---

## Get Student by ID

**Endpoint:** `GET /api/students/:id`

### Usage

```bash
GET /api/students/1
GET /api/students/22
```

### Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "student_id": "STU-0002",
    "full_name": "प्रिया सुनील देशमुख",
    "father_name": "सुनील देशमुख",
    "mother_name": "कविता देशमुख",
    "date_of_birth": "2011-08-20",
    "leaving_date": "2024-03-25",
    "status": "active",
    "school_name": "नगर परिषद प्राथमिक शाळा",
    "school_recognition_no": "4260/37",
    "medium": "Marathi",
    ...
  }
}
```

---

## Search Student by Identifier

**Endpoint:** `GET /api/students/search/:identifier`

Searches by Student ID or Aadhaar number (exact match).

### Usage

```bash
# Search by Student ID
GET /api/students/search/STU-0002

# Search by Aadhaar number
GET /api/students/search/234523452345
```

### Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "student_id": "STU-0002",
    "uid_aadhar_no": "234523452345",
    "full_name": "प्रिया सुनील देशमुख",
    ...
  }
}
```

---

## Common Use Cases

### 1. Find all active students from a specific school
```bash
GET /api/students?status=active&school_id=1
```

### 2. Find students by name (partial match)
```bash
GET /api/students?student_name=प्रिया
```

### 3. Find students by Aadhaar
```bash
GET /api/students?aadhaar=234523452345
```

### 4. Find students who left in 2024, sorted by leaving date
```bash
GET /api/students?leaving_date_from=2024-01-01&leaving_date_to=2024-12-31&sort_by=leaving_date&sort_order=DESC
```

### 5. Find students by district and caste
```bash
GET /api/students?district=नागपूर&caste=मराठा
```

### 6. Complex search with multiple criteria
```json
POST /api/students/search
{
  "page": 1,
  "limit": 50,
  "sort_by": "leaving_date",
  "sort_order": "DESC",
  "filters": {
    "status": "active",
    "district": "नागपूर",
    "date_of_birth_from": "2010-01-01",
    "date_of_birth_to": "2012-12-31",
    "certificate_year": 2024,
    "caste": "मराठा"
  }
}
```

---

## Tips

1. **Use GET for simple queries** - When you have 1-3 filter parameters, GET is simpler.

2. **Use POST for complex queries** - When you have many filters, POST is cleaner and easier to read.

3. **Pagination** - Always use pagination for large result sets. Default limit is 100, max is 1000.

4. **Sorting** - Default sort is by `created_at DESC` (newest first). Change with `sort_by` and `sort_order`.

5. **Partial matches** - Fields like `student_name`, `school_name`, `district` support partial matching (case-insensitive).

6. **Exact matches** - Fields like `student_id`, `aadhaar`, `school_recognition_no` require exact matches.

7. **Date ranges** - Use `_from` and `_to` suffixes for date range filtering.

8. **Aliases** - You can use `student_name` instead of `full_name`, `aadhaar` instead of `uid_aadhar_no`, `date_of_leaving` instead of `leaving_date`.

---

## Error Responses

### 404 - Not Found
```json
{
  "success": false,
  "error": "Student not found"
}
```

### 400 - Bad Request
```json
{
  "success": false,
  "error": "Validation error",
  "errors": [...]
}
```

### 500 - Server Error
```json
{
  "success": false,
  "error": "Failed to fetch students"
}
```

