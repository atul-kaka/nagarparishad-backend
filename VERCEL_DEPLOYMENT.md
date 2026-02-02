# Vercel Deployment Guide

## Overview

Vercel is a popular platform for deploying web applications, especially frontend apps and serverless functions. However, there are important considerations for your Node.js backend with on-premise PostgreSQL database.

---

## Vercel vs Azure Comparison

### Vercel Advantages

✅ **Free tier is generous**
- Unlimited deployments
- 100 GB bandwidth/month
- Serverless functions included
- Free SSL certificates
- Global CDN included

✅ **Easy deployment**
- GitHub integration (auto-deploy on push)
- Zero-config deployment
- Preview deployments for every PR

✅ **Great for frontend**
- Optimized for React, Vue, Next.js
- Automatic optimizations

✅ **Fast global CDN**
- Edge network for static assets
- Low latency worldwide

### Vercel Limitations for Your Use Case

⚠️ **Serverless Functions (Not Full Node.js)**
- Your Express app needs to be converted to serverless functions
- Cold starts (first request can be slow)
- 10-second timeout on free tier, 60 seconds on Pro
- Not ideal for long-running connections

⚠️ **Database Connection Issues**
- Serverless functions have short-lived connections
- Connection pooling is challenging
- On-premise database access requires:
  - Public IP with port forwarding (same as Azure)
  - Or VPN (more complex on Vercel)

⚠️ **No Persistent Connections**
- PostgreSQL connection pooling doesn't work well
- Each function invocation creates new connection
- Can cause connection exhaustion

---

## Cost Comparison: Vercel vs Azure

### Vercel Pricing

| Tier | Price/Month | Features |
|------|-------------|----------|
| **Hobby (Free)** | ₹0 | Unlimited deployments, 100 GB bandwidth, Serverless functions |
| **Pro** | ₹1,500/month (~$18) | 1 TB bandwidth, Team collaboration, Analytics |
| **Enterprise** | Custom | Dedicated support, SLA |

### Cost Comparison

| Platform | Free Tier | Small Production | Production |
|----------|-----------|------------------|------------|
| **Vercel** | ₹0 | ₹1,500 (Pro) | ₹1,500 (Pro) |
| **Azure** | ₹0 | ₹1,000 (B1) | ₹3,800 (S1) |

**Verdict**: Vercel is cheaper for small apps, but Azure is better for traditional Express apps.

---

## Deployment Options on Vercel

### Option 1: Convert to Serverless Functions (Recommended for Vercel)

Convert your Express routes to Vercel serverless functions.

**Structure:**
```
/api
  /students.js          → GET /api/students
  /students/[id].js     → GET /api/students/:id
  /schools.js           → GET /api/schools
  /auth
    /login.js           → POST /api/auth/login
```

**Example:**
```javascript
// api/students.js
const pool = require('../config/database');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const students = await pool.query('SELECT * FROM students WHERE status = $1', ['active']);
    res.json({ success: true, data: students.rows });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
```

**Pros:**
- ✅ True serverless (pay per request)
- ✅ Auto-scaling
- ✅ Fast cold starts

**Cons:**
- ❌ Requires code refactoring
- ❌ Connection pooling issues
- ❌ Cold starts can be slow

---

### Option 2: Use Vercel with Express (Not Recommended)

You can deploy Express app, but it runs as serverless functions with limitations.

**Issues:**
- Each route becomes a separate function
- Shared state doesn't work
- Middleware needs adjustment
- Connection pooling doesn't work well

---

### Option 3: Hybrid Approach (Best for Your Case)

**Frontend on Vercel + Backend on Azure/Railway/Render**

- Deploy frontend to Vercel (free, fast CDN)
- Deploy backend to Azure/Railway (traditional Express app)
- Best of both worlds

---

## Step-by-Step: Deploying to Vercel

### Prerequisites

1. **Vercel account**: Sign up at https://vercel.com (free)
2. **GitHub repository**: Your code pushed to GitHub
3. **Database**: On-premise PostgreSQL accessible via public IP

---

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

Or use npx:
```bash
npx vercel
```

---

### Step 2: Convert Express App to Serverless Functions

#### 2.1 Create `vercel.json` Configuration

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/api/$1"
    }
  ],
  "env": {
    "DB_HOST": "@db-host",
    "DB_PORT": "@db-port",
    "DB_NAME": "@db-name",
    "DB_USER": "@db-user",
    "DB_PASSWORD": "@db-password",
    "JWT_SECRET": "@jwt-secret"
  }
}
```

#### 2.2 Restructure Your Code

**Current structure:**
```
nagarparishad-backend/
  server.js
  routes/
    students.js
    schools.js
  models/
  config/
```

**Vercel structure:**
```
nagarparishad-backend/
  api/
    students.js          (serverless function)
    students/
      [id].js            (serverless function)
    schools.js
    auth/
      login.js
  models/
  config/
  vercel.json
```

#### 2.3 Convert Routes to Serverless Functions

**Example: Convert students route**

```javascript
// api/students.js
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// This will be called for each request
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { page = 1, limit = 10, status, search } = req.query;
      const students = await Student.findAll({ status, search }, { 
        limit: parseInt(limit), 
        offset: (parseInt(page) - 1) * parseInt(limit) 
      });
      res.json({ success: true, data: students });
    } else if (req.method === 'POST') {
      const student = await Student.create(req.body);
      res.status(201).json({ success: true, data: student });
    } else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
```

**Example: Dynamic route**

```javascript
// api/students/[id].js
const Student = require('../models/Student');

module.exports = async (req, res) => {
  const { id } = req.query; // Vercel uses req.query for dynamic params
  
  try {
    if (req.method === 'GET') {
      const student = await Student.findById(id);
      if (!student) {
        return res.status(404).json({ success: false, error: 'Student not found' });
      }
      res.json({ success: true, data: student });
    } else if (req.method === 'PUT') {
      const student = await Student.update(id, req.body);
      res.json({ success: true, data: student });
    } else if (req.method === 'DELETE') {
      await Student.delete(id);
      res.json({ success: true, message: 'Student deleted' });
    } else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

---

### Step 3: Configure Environment Variables

#### 3.1 Using Vercel Dashboard

1. Go to your project on Vercel
2. **Settings** → **Environment Variables**
3. Add:
   ```
   DB_HOST=152.56.13.233
   DB_PORT=5432
   DB_NAME=nagarparishad_db
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   JWT_SECRET=your_jwt_secret
   NODE_ENV=production
   ```

#### 3.2 Using Vercel CLI

```bash
vercel env add DB_HOST
# Enter: 152.56.13.233

vercel env add DB_PORT
# Enter: 5432

vercel env add DB_NAME
# Enter: nagarparishad_db

vercel env add DB_USER
# Enter: your_db_user

vercel env add DB_PASSWORD
# Enter: your_db_password

vercel env add JWT_SECRET
# Enter: your_jwt_secret
```

---

### Step 4: Deploy to Vercel

#### 4.1 Using Vercel Dashboard

1. Go to https://vercel.com
2. **Add New Project**
3. **Import Git Repository** → Select your GitHub repo
4. **Framework Preset**: Other
5. **Root Directory**: `nagarparishad-backend`
6. **Build Command**: (leave empty or `npm install`)
7. **Output Directory**: (leave empty)
8. Click **Deploy**

#### 4.2 Using Vercel CLI

```bash
cd nagarparishad-backend
vercel
```

Follow prompts:
- Set up and deploy? **Yes**
- Which scope? **Your account**
- Link to existing project? **No**
- Project name? **nagarparishad-api**
- Directory? **./**
- Override settings? **No**

---

### Step 5: Configure Custom Domain

1. Go to project → **Settings** → **Domains**
2. Add domain: `api.kaamlo.com`
3. Add DNS record:
   ```
   Type: CNAME
   Name: api
   Value: cname.vercel-dns.com
   ```
4. Wait for DNS propagation (5-10 minutes)
5. SSL certificate auto-provisioned

---

## Database Connection Considerations

### Issue: Connection Pooling

**Problem:**
- Serverless functions create new connections each time
- PostgreSQL has connection limits
- Can exhaust connections quickly

**Solution 1: Use Connection Pooling Service**

Use **PgBouncer** or **PgPool** on your database server:

```bash
# Install PgBouncer on your DB server
# Configure connection pooling
# Vercel connects to PgBouncer instead of PostgreSQL directly
```

**Solution 2: Use Serverless-Compatible Database**

Consider migrating to:
- **Supabase** (PostgreSQL, free tier)
- **Neon** (Serverless PostgreSQL, free tier)
- **Railway** (PostgreSQL, $5/month)

**Solution 3: Keep Backend on Azure/Railway**

- Deploy frontend to Vercel (free, fast)
- Deploy backend to Azure/Railway (traditional Express)
- Best of both worlds

---

## Alternative: Hybrid Deployment (Recommended)

### Frontend on Vercel + Backend on Railway/Render

**Why this is better:**
- ✅ Frontend gets Vercel's fast CDN (free)
- ✅ Backend runs as traditional Express app (no refactoring)
- ✅ Better database connection handling
- ✅ Lower total cost

**Cost:**
- Vercel (Frontend): ₹0 (free)
- Railway (Backend): ₹400/month (~$5) or Render: ₹800/month (~$10)
- **Total**: ₹400-800/month

**Railway Deployment:**
1. Sign up at https://railway.app
2. New Project → Deploy from GitHub
3. Add environment variables
4. Deploy (automatic)

**Render Deployment:**
1. Sign up at https://render.com
2. New Web Service → Connect GitHub
3. Build: `npm install && npm start`
4. Add environment variables
5. Deploy

---

## Vercel Deployment Checklist

### Pre-Deployment

- [ ] Code restructured for serverless functions
- [ ] `vercel.json` configured
- [ ] Environment variables documented
- [ ] Database accessible from internet (port forwarding)
- [ ] PostgreSQL `pg_hba.conf` allows Vercel IPs

### Deployment

- [ ] Vercel account created
- [ ] GitHub repository connected
- [ ] Environment variables added
- [ ] Project deployed
- [ ] Custom domain configured
- [ ] SSL certificate active

### Testing

- [ ] Health endpoint working
- [ ] Database connection working
- [ ] API endpoints responding
- [ ] Authentication working
- [ ] CORS configured correctly

---

## Pros and Cons Summary

### Vercel Pros

✅ Free tier is generous
✅ Easy GitHub integration
✅ Fast global CDN
✅ Automatic SSL
✅ Preview deployments
✅ Great for frontend

### Vercel Cons

❌ Requires code refactoring (Express → Serverless)
❌ Connection pooling issues with PostgreSQL
❌ Cold starts (first request slow)
❌ 10-60 second timeout limits
❌ Not ideal for long-running processes
❌ On-premise database access is challenging

---

## Recommendation

### For Your Use Case:

**Option 1: Full Vercel (If you're willing to refactor)**
- Convert Express to serverless functions
- Use connection pooling service (PgBouncer)
- **Cost**: ₹0-1,500/month
- **Effort**: High (code refactoring)

**Option 2: Hybrid (Recommended)**
- Frontend on Vercel (free, fast CDN)
- Backend on Railway/Render (₹400-800/month)
- **Cost**: ₹400-800/month
- **Effort**: Low (no refactoring)

**Option 3: Full Azure (Original Plan)**
- Frontend on Azure Static Web Apps
- Backend on Azure App Service
- **Cost**: ₹1,000-3,800/month
- **Effort**: Low (minimal changes)

---

## Quick Start: Hybrid Deployment

### Deploy Frontend to Vercel

```bash
cd your-frontend-folder
vercel
```

### Deploy Backend to Railway

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select your backend repo
4. Add environment variables
5. Deploy (automatic)

**Total Cost**: ₹400/month (Railway) + ₹0 (Vercel) = **₹400/month**

---

## Conclusion

**Vercel is excellent for:**
- Frontend applications
- Serverless APIs (if designed for it)
- Static sites
- JAMstack applications

**Vercel is challenging for:**
- Traditional Express apps (requires refactoring)
- Long-running processes
- Database connection pooling
- On-premise database access

**My Recommendation**: Use **hybrid approach** (Frontend on Vercel + Backend on Railway/Render) for best balance of cost, performance, and ease of deployment.

---

**Need help with specific deployment?** Let me know which option you prefer!




