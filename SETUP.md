# Quick Setup Guide

## Step 1: Install PostgreSQL

If you don't have PostgreSQL installed:

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Or use chocolatey: `choco install postgresql`

**macOS:**
- `brew install postgresql`
- `brew services start postgresql`

**Linux (Ubuntu/Debian):**
- `sudo apt-get install postgresql postgresql-contrib`
- `sudo systemctl start postgresql`

## Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE nagarparishad_db;

# Exit psql
\q
```

## Step 3: Install Node.js Dependencies

```bash
cd nagarparishad-backend
npm install
```

## Step 4: Configure Environment Variables

```bash
# Copy the example file
copy env.example.txt .env    # Windows
cp env.example.txt .env      # macOS/Linux
```

Edit `.env` and update database credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nagarparishad_db
DB_USER=postgres
DB_PASSWORD=your_actual_password
PORT=3000
NODE_ENV=development
```

## Step 5: Run Database Migration

```bash
npm run migrate
```

This will create all tables in the database.

## Step 6: Start the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The API will be available at `http://localhost:3000`

## Testing the API

Use curl, Postman, or any HTTP client:

```bash
# Health check
curl http://localhost:3000/health

# Get all schools
curl http://localhost:3000/api/schools

# Get API info
curl http://localhost:3000/
```

## Database Tables Created

- `schools` - School information
- `students` - Student personal information  
- `leaving_certificates` - Certificate data with relationships

## Troubleshooting

**Database connection error:**
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `.env` file
- Ensure database exists: `psql -U postgres -l`

**Port already in use:**
- Change PORT in `.env` file
- Or stop the service using port 3000

**Migration errors:**
- Ensure database is empty or tables don't exist
- Check PostgreSQL user has CREATE privileges

