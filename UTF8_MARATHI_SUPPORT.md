# UTF-8 Marathi Support Guide

This document explains how UTF-8 encoding is configured to support Marathi and other Unicode characters in the Nagar Parishad backend system.

## Overview

The system is configured to handle UTF-8 encoding throughout the entire stack:
- **Database**: PostgreSQL with UTF-8 encoding
- **Node.js/Express**: UTF-8 support in request/response handling
- **Database Connection**: Explicit UTF-8 client encoding

## Configuration

### 1. Database Connection (`config/database.js`)

The PostgreSQL connection pool is configured with UTF-8 encoding:

```javascript
const pool = new Pool({
  // ... other config
  client_encoding: 'UTF8',  // Explicit UTF-8 encoding
});
```

Each connection automatically sets UTF-8 encoding when established.

### 2. Express Server (`server.js`)

The Express server is configured to:
- Handle UTF-8 in JSON requests/responses
- Set UTF-8 charset in response headers

```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Set UTF-8 charset in response headers
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});
```

### 3. Database Schema

PostgreSQL databases created with UTF-8 encoding automatically support Unicode characters in all `VARCHAR` and `TEXT` columns.

**Verify Database Encoding:**
```sql
SELECT datname, pg_encoding_to_char(encoding) as encoding 
FROM pg_database 
WHERE datname = current_database();
```

Expected result: `UTF8`

## Testing Marathi Support

### Test Insert (via API)

```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "fullName": "राजेश कुमार",
    "fatherName": "रामेश कुमार",
    "motherName": "सीता देवी",
    "dateOfBirth": "2010-01-15"
  }'
```

### Test Query (via psql)

```sql
-- Insert test data
INSERT INTO students (full_name, father_name, date_of_birth) 
VALUES ('राजेश कुमार', 'रामेश कुमार', '2010-01-15');

-- Query and verify
SELECT full_name, father_name FROM students WHERE full_name LIKE '%राजेश%';
```

### Test via API Response

```bash
curl -H "Accept: application/json; charset=utf-8" \
  http://localhost:3000/api/students/1
```

## Common Issues and Solutions

### Issue 1: Question Marks (???) Instead of Marathi Characters

**Cause:** Database or connection not using UTF-8 encoding.

**Solution:**
1. Verify database encoding:
   ```sql
   SELECT pg_encoding_to_char(encoding) FROM pg_database WHERE datname = current_database();
   ```

2. If not UTF-8, recreate database:
   ```sql
   CREATE DATABASE nagarparishad_db 
   WITH ENCODING 'UTF8' 
   LC_COLLATE='en_US.UTF-8' 
   LC_CTYPE='en_US.UTF-8';
   ```

### Issue 2: Garbled Characters in API Response

**Cause:** Response headers not set to UTF-8.

**Solution:** The server.js already sets UTF-8 headers. Verify with:
```bash
curl -I http://localhost:3000/api/students/1
```

Should show: `Content-Type: application/json; charset=utf-8`

### Issue 3: Characters Lost During Insert

**Cause:** Client not sending UTF-8 encoded data.

**Solution:** Ensure your API client (Postman, curl, etc.) sends UTF-8:
- Postman: Check "Body" → "raw" → "JSON" and ensure UTF-8 encoding
- curl: Use `-H "Content-Type: application/json; charset=utf-8"`

## Database Migration

Run the migration to verify UTF-8 support:

```bash
psql -U postgres -d nagarparishad_db -f database/migrations/013_ensure_utf8_encoding.sql
```

## Verification Checklist

- [ ] Database encoding is UTF-8
- [ ] Database connection sets UTF-8 client encoding
- [ ] Express sets UTF-8 charset in response headers
- [ ] API client sends UTF-8 encoded requests
- [ ] Test insert with Marathi characters works
- [ ] Test query returns Marathi characters correctly
- [ ] API response shows Marathi characters correctly

## Supported Character Sets

The system supports:
- **Marathi** (मराठी): Full Unicode support
- **Hindi** (हिंदी): Full Unicode support
- **English**: ASCII and extended ASCII
- **Other Unicode scripts**: Devanagari, Latin, Arabic, etc.

## Best Practices

1. **Always use UTF-8** in API requests and responses
2. **Verify encoding** when creating new databases
3. **Test with Marathi characters** before deploying to production
4. **Set charset explicitly** in HTTP headers
5. **Use UTF-8 compatible tools** for database administration

## Example Marathi Data

```json
{
  "fullName": "राजेश कुमार पाटील",
  "fatherName": "रामेश कुमार पाटील",
  "motherName": "सीता देवी पाटील",
  "birthPlaceVillage": "पुणे",
  "birthPlaceTaluka": "पुणे",
  "birthPlaceDistrict": "पुणे",
  "birthPlaceState": "महाराष्ट्र",
  "motherTongue": "मराठी",
  "previousSchool": "शाळा नाव",
  "reasonForLeaving": "शिक्षण पूर्ण"
}
```

## Additional Resources

- [PostgreSQL Character Set Support](https://www.postgresql.org/docs/current/multibyte.html)
- [UTF-8 Encoding Guide](https://en.wikipedia.org/wiki/UTF-8)
- [Marathi Unicode Block](https://en.wikipedia.org/wiki/Devanagari_(Unicode_block))

