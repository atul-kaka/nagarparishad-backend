# Scaling Guide - 2 Lakh Certificates + 1 Lakh Audit Records

## Overview

This guide covers optimizations and recommendations for handling:
- **200,000 certificate records** (students table)
- **100,000 audit records** (audit_logs table)
- **Expected growth**: 10,000-20,000 new certificates/year

---

## Database Performance Recommendations

### 1. Database Hosting Decision

#### Option A: Keep On-Premise (Current Setup)

**Pros:**
- ✅ Full control
- ✅ No data transfer costs
- ✅ Low latency for office users
- ✅ No monthly database hosting cost

**Cons:**
- ❌ Requires maintenance
- ❌ Backup management
- ❌ Scaling limitations
- ❌ Single point of failure

**Recommendation**: **Keep on-premise** if:
- You have IT support
- Backup strategy in place
- Server has good specs (8GB+ RAM, SSD)

#### Option B: Migrate to Cloud Database

**Azure Database for PostgreSQL:**
- **Basic tier**: ₹2,000-5,000/month (2 vCores, 5GB RAM)
- **General Purpose**: ₹5,000-15,000/month (better performance)
- **Benefits**: Auto-backups, scaling, high availability

**Supabase (PostgreSQL):**
- **Free tier**: 500MB database
- **Pro tier**: ₹1,200/month (8GB database, better performance)

**Recommendation**: **Consider cloud** if:
- You want managed backups
- Need high availability
- Don't have IT support

---

## Database Optimization Strategies

### 1. Indexing Strategy

#### Critical Indexes for Performance

```sql
-- Students table indexes
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_uid_aadhar ON students(uid_aadhar_no);
CREATE INDEX IF NOT EXISTS idx_students_serial_no ON students(serial_no);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_students_status_school ON students(status, school_id);
CREATE INDEX IF NOT EXISTS idx_students_search ON students USING gin(to_tsvector('english', 
  COALESCE(full_name, '') || ' ' || 
  COALESCE(student_id, '') || ' ' || 
  COALESCE(uid_aadhar_no, '')
));

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_by ON audit_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

-- Composite index for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_table_record_date ON audit_logs(table_name, record_id, created_at DESC);
```

**Impact**: 
- Query time: **10-100x faster** for filtered searches
- Index maintenance: Minimal overhead (~5-10% storage)

---

### 2. Query Optimization

#### Pagination Best Practices

**Current Implementation (Good):**
```javascript
// Already implemented in Student.findAll()
const students = await Student.findAll(
  { status: 'active', search: 'query' },
  { limit: 20, offset: 0 }
);
```

**Optimization: Cursor-Based Pagination (For Large Datasets)**

```javascript
// Instead of OFFSET (slow for large offsets)
// Use cursor-based pagination
static async findAllCursor(filters = {}, cursor = null, limit = 20) {
  let query = `
    SELECT * FROM students
    WHERE 1=1
  `;
  const values = [];
  let paramCount = 1;

  // Add filters
  if (filters.status) {
    query += ` AND status = $${paramCount}`;
    values.push(filters.status);
    paramCount++;
  }

  // Cursor-based pagination (faster than OFFSET)
  if (cursor) {
    query += ` AND id > $${paramCount}`;
    values.push(cursor);
    paramCount++;
  }

  query += ` ORDER BY id ASC LIMIT $${paramCount}`;
  values.push(limit);

  const result = await pool.query(query, values);
  return result.rows;
}
```

**Performance Comparison:**
- **OFFSET 100,000**: ~2-5 seconds
- **Cursor-based**: ~50-200ms (100x faster)

---

### 3. Database Configuration Tuning

#### PostgreSQL Configuration for 200K+ Records

**On your PostgreSQL server, edit `postgresql.conf`:**

```conf
# Memory settings (adjust based on your RAM)
shared_buffers = 2GB              # 25% of RAM (if 8GB RAM)
effective_cache_size = 6GB        # 75% of RAM
work_mem = 16MB                   # For sorting operations
maintenance_work_mem = 512MB      # For index creation

# Connection settings
max_connections = 100
max_worker_processes = 4

# Query planner
random_page_cost = 1.1            # For SSD (default 4.0 for HDD)
effective_io_concurrency = 200    # For SSD

# Logging (for monitoring)
log_min_duration_statement = 1000  # Log queries > 1 second
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

**Restart PostgreSQL after changes**

---

### 4. Caching Strategy

#### Redis Caching (Recommended)

**Install Redis** (on your server or use Azure Redis Cache):

```bash
# Windows: Use WSL or Docker
docker run -d -p 6379:6379 redis:alpine
```

**Add Redis to Node.js:**

```javascript
// config/redis.js
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

module.exports = client;
```

**Cache Frequently Accessed Data:**

```javascript
// routes/students.js
const redis = require('../config/redis');

router.get('/', async (req, res) => {
  const cacheKey = `students:${JSON.stringify(req.query)}`;
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  // Fetch from database
  const students = await Student.findAll(req.query, req.pagination);
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(students));
  
  res.json(students);
});
```

**What to Cache:**
- ✅ School list (rarely changes)
- ✅ Active certificates (5 min cache)
- ✅ Search results (2 min cache)
- ❌ Don't cache: Admin queries, real-time data

**Cost**: 
- Self-hosted Redis: ₹0
- Azure Redis Cache: ₹1,500-3,000/month

---

### 5. Database Partitioning (For Audit Logs)

#### Partition Audit Logs by Date

**Partitioning Strategy:**

```sql
-- Create partitioned table
CREATE TABLE audit_logs (
  id SERIAL,
  table_name VARCHAR(100),
  record_id INTEGER,
  action VARCHAR(50),
  changed_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- other fields
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Auto-create partitions (use cron job or function)
```

**Benefits:**
- ✅ Faster queries (only scan relevant partition)
- ✅ Easier archiving (drop old partitions)
- ✅ Better maintenance

**Impact**: 
- Query time: **5-10x faster** for date-filtered queries
- Maintenance: Easier to archive old data

---

## Application-Level Optimizations

### 1. API Response Optimization

#### Limit Response Size

```javascript
// routes/students.js
router.get('/', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100
  const students = await Student.findAll(req.query, { limit, offset });
  res.json({ success: true, data: students });
});
```

#### Use Field Selection

```javascript
// Only return needed fields
const students = await pool.query(`
  SELECT id, full_name, student_id, status, school_id 
  FROM students 
  WHERE status = $1 
  LIMIT $2
`, ['active', 20]);
```

---

### 2. Background Jobs for Heavy Operations

#### Use Queue System (Bull/BullMQ)

**For heavy operations:**
- Bulk imports
- Report generation
- Data exports
- Audit log cleanup

```javascript
// jobs/exportCertificates.js
const Queue = require('bull');
const exportQueue = new Queue('certificate-export', {
  redis: { host: 'localhost', port: 6379 }
});

exportQueue.process(async (job) => {
  const { filters, userId } = job.data;
  // Generate export file
  // Send email notification
});
```

---

### 3. Search Optimization

#### Full-Text Search

```sql
-- Add full-text search index
ALTER TABLE students ADD COLUMN search_vector tsvector;
CREATE INDEX idx_students_search_vector ON students USING gin(search_vector);

-- Update search vector
UPDATE students SET search_vector = 
  to_tsvector('english', 
    COALESCE(full_name, '') || ' ' || 
    COALESCE(student_id, '') || ' ' || 
    COALESCE(uid_aadhar_no, '')
  );

-- Search query
SELECT * FROM students 
WHERE search_vector @@ to_tsquery('english', 'student_name')
LIMIT 20;
```

**Performance**: **10-50x faster** than LIKE queries

---

## Infrastructure Recommendations

### 1. Database Server Specs

#### Minimum Requirements (200K records)

```
CPU: 4 cores
RAM: 8GB (16GB recommended)
Storage: SSD 100GB+ (SSD is critical!)
Network: 100 Mbps+
```

#### Recommended Specs

```
CPU: 8 cores
RAM: 16GB
Storage: NVMe SSD 200GB+
Network: 1 Gbps
```

**Cost**: 
- On-premise: One-time hardware cost
- Cloud: ₹5,000-15,000/month (Azure Database)

---

### 2. Application Server (Backend)

#### Azure App Service Recommendations

**For 200K records:**
- **Basic B2**: ₹2,000/month (2 cores, 3.5GB RAM)
- **Standard S2**: ₹7,600/month (2 cores, 3.5GB RAM) - Recommended

**Why Standard S2:**
- ✅ Auto-scaling (handles traffic spikes)
- ✅ Better performance
- ✅ Deployment slots

#### Railway/Render Recommendations

- **Pro Plan**: ₹400-800/month
- **Upgrade if**: High concurrent users (>100)

---

### 3. Backup Strategy

#### Automated Backups

**PostgreSQL Automated Backups:**

```bash
# Windows Task Scheduler or cron job
# Daily backup script
pg_dump -U postgres -d nagarparishad_db -F c -f backup_$(date +%Y%m%d).dump

# Keep last 30 days
# Upload to cloud storage (Azure Blob, AWS S3)
```

**Azure Blob Storage:**
- **Hot tier**: ₹15/GB/month
- **Cool tier**: ₹5/GB/month (for backups)
- **Estimated**: ₹500-1,000/month for backups

---

## Performance Benchmarks

### Expected Query Times (With Optimizations)

| Query Type | Without Index | With Index | With Cache |
|------------|---------------|------------|------------|
| **Get 20 active certificates** | 500-2000ms | 50-200ms | 5-20ms |
| **Search by name** | 2000-5000ms | 100-500ms | 20-100ms |
| **Get audit logs** | 1000-3000ms | 100-300ms | 50-150ms |
| **Bulk export (1000 records)** | 5000-10000ms | 1000-3000ms | N/A |

---

## Monitoring & Alerts

### 1. Database Monitoring

**Key Metrics to Monitor:**
- Query execution time
- Connection pool usage
- Disk I/O
- Cache hit ratio

**Tools:**
- **pgAdmin**: Built-in monitoring
- **Azure Application Insights**: If using Azure
- **Grafana + Prometheus**: Self-hosted monitoring

---

### 2. Application Monitoring

**Set Up Alerts For:**
- Slow queries (>1 second)
- High error rate (>1%)
- Database connection failures
- High memory usage

---

## Cost Summary

### Option 1: On-Premise Database + Cloud Backend

```
Backend (Azure S2)        ₹7,600/month
Database (On-premise)    ₹0
Redis Cache (Self-host)  ₹0
Backups (Azure Blob)     ₹1,000/month
─────────────────────────────────────
Total                    ₹8,600/month
```

### Option 2: Cloud Database + Cloud Backend

```
Backend (Azure S2)              ₹7,600/month
Database (Azure PostgreSQL)     ₹5,000/month
Redis Cache (Azure Redis)       ₹2,000/month
Backups (Included)              ₹0
─────────────────────────────────────────
Total                            ₹14,600/month
```

### Option 3: Railway Backend + On-Premise DB

```
Backend (Railway Pro)    ₹400/month
Database (On-premise)     ₹0
Redis Cache (Self-host)  ₹0
Backups (Azure Blob)     ₹1,000/month
─────────────────────────────────────
Total                    ₹1,400/month
```

---

## Migration Plan

### Phase 1: Immediate (Week 1)

1. ✅ Add critical indexes
2. ✅ Optimize pagination (already done)
3. ✅ Configure PostgreSQL settings
4. ✅ Set up monitoring

### Phase 2: Short-term (Month 1)

1. ✅ Implement Redis caching
2. ✅ Optimize slow queries
3. ✅ Set up automated backups
4. ✅ Add full-text search

### Phase 3: Long-term (Month 2-3)

1. ✅ Partition audit logs
2. ✅ Implement cursor-based pagination
3. ✅ Set up background jobs
4. ✅ Consider cloud database migration

---

## Recommendations Summary

### For 200K Certificates + 100K Audit Records:

**✅ Keep Database On-Premise** (if you have good hardware)
- Add indexes (critical!)
- Tune PostgreSQL config
- Use SSD storage
- Set up automated backups

**✅ Use Cloud Backend** (Azure S2 or Railway Pro)
- Better performance
- Auto-scaling
- Managed infrastructure

**✅ Add Redis Caching**
- Self-hosted (free)
- Cache frequently accessed data
- 10-100x faster responses

**✅ Optimize Queries**
- Use indexes
- Implement pagination (already done)
- Add full-text search

**✅ Monitor Performance**
- Set up query logging
- Monitor slow queries
- Track connection pool usage

---

## Expected Performance

**With All Optimizations:**

- **API Response Time**: <200ms (95th percentile)
- **Search Queries**: <500ms
- **Database Load**: <50% CPU
- **Concurrent Users**: 100+ (with proper scaling)

---

**Next Steps**: Start with Phase 1 optimizations (indexes + PostgreSQL tuning). This will give you immediate performance improvements!




