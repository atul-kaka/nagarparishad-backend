# Quick Setup Guide - New Server

## Fastest Method (One Command)

### Step 1: Create Database

```bash
psql -U postgres -c "CREATE DATABASE nagarparishad_db WITH ENCODING 'UTF8';"
```

### Step 2: Run Complete Schema

```bash
psql -U postgres -d nagarparishad_db -f database/complete_schema.sql
```

**That's it!** All tables, indexes, and triggers are now created.

---

## Verify Setup

```bash
psql -U postgres -d nagarparishad_db -c "\dt"
```

You should see:
- `users`
- `schools`
- `students`
- `leaving_certificates`
- `audit_logs`
- `certificate_status_history`
- `password_reset_tokens`

---

## For Remote Server

```bash
# Replace with your server details
psql -h your-server-ip -U postgres -c "CREATE DATABASE nagarparishad_db WITH ENCODING 'UTF8';"
psql -h your-server-ip -U postgres -d nagarparishad_db -f database/complete_schema.sql
```

---

## What's Included

The `complete_schema.sql` file includes:
- ✅ All tables (users, schools, students, etc.)
- ✅ All indexes for performance
- ✅ All triggers for auto-updating timestamps
- ✅ All foreign key constraints
- ✅ All unique constraints
- ✅ UTF-8 encoding support
- ✅ QR code hash column
- ✅ Audit trail tables

No need to run individual migrations - everything is in one file!

