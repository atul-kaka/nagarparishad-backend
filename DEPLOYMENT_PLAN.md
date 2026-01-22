# Deployment Plan - Nagarparishad Leaving Certificate System

## Overview

This document outlines the deployment strategy for the Nagarparishad Leaving Certificate System, supporting:
- **Multilingual Support**: Marathi and English
- **Public Access**: Citizens can view/search certificates
- **Office Access**: Admin/Super Admin can manage records

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PUBLIC INTERNET                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────┐                      ┌───────────────┐
│  Azure CDN    │                      │  Azure App    │
│  (Static UI)  │                      │  Service      │
│               │                      │  (Backend API) │
│  Frontend     │                      │               │
│  (React/Vue)  │                      │  Node.js API  │
└───────────────┘                      └───────┬───────┘
                                               │
                                               │ HTTPS
                                               │
                                               ▼
                                    ┌───────────────────┐
                                    │   Azure VPN /     │
                                    │   Site-to-Site    │
                                    │   (Optional)      │
                                    └──────────┬────────┘
                                               │
                                               │ Private Network
                                               │
                                               ▼
                                    ┌───────────────────┐
                                    │  On-Premise       │
                                    │  Database Server  │
                                    │                   │
                                    │  PostgreSQL       │
                                    │  152.56.13.233    │
                                    └───────────────────┘
```

---

## Deployment Components

### 1. **Frontend (Public UI)**
- **Location**: Azure Static Web Apps or Azure Blob Storage + CDN
- **Purpose**: Public-facing certificate search/view interface
- **Access**: Public (no authentication required for viewing)
- **Languages**: Marathi and English (i18n support)

### 2. **Backend API (Node.js)**
- **Location**: Azure App Service (Linux)
- **Purpose**: REST API for all operations
- **Access**: 
  - Public endpoints (view/search) - No auth
  - Admin endpoints - JWT authentication
- **Database**: Connects to on-premise PostgreSQL

### 3. **Database (PostgreSQL)**
- **Location**: On-premise server (your current machine)
- **IP**: 152.56.13.233
- **Access**: 
  - Azure App Service connects via VPN or port-forward
  - Office network has direct access

---

## Deployment Strategy

### Phase 1: Backend API Deployment

#### Step 1.1: Prepare Azure App Service

1. **Create Azure App Service**
   ```bash
   # Using Azure CLI (optional)
   az webapp create \
     --resource-group nagarparishad-rg \
     --plan nagarparishad-plan \
     --name nagarparishad-api \
     --runtime "NODE:18-lts"
   ```

2. **Configure Application Settings**
   - Go to Azure Portal → App Service → Configuration → Application settings
   - Add these environment variables:
     ```
     DB_HOST=152.56.13.233
     DB_PORT=5432
     DB_USER=<your_db_user>
     DB_PASSWORD=<your_db_password>
     DB_NAME=<your_db_name>
     JWT_SECRET=<your_jwt_secret>
     NODE_ENV=production
     PORT=8080
     ```

3. **Enable HTTPS**
   - Go to Custom domains → Add domain: `api.kaamlo.com`
   - Use App Service Managed Certificate (free SSL)

#### Step 1.2: Database Connection Setup

**Option A: Port Forwarding (Quick Start)**
1. Configure router port forward: `5432 → 192.168.31.47:5432`
2. Configure Windows Firewall to allow Azure outbound IPs
3. Update PostgreSQL `pg_hba.conf` to allow Azure IPs

**Option B: Azure VPN (Recommended for Production)**
1. Create Azure Virtual Network Gateway
2. Set up Site-to-Site VPN to your office network
3. App Service connects via VNet integration
4. Database accessible via private IP (more secure)

#### Step 1.3: Deploy Code

**Using GitHub Actions (Recommended)**
1. Push code to GitHub repository
2. Azure Portal → Deployment Center → Connect to GitHub
3. Azure will create GitHub Actions workflow
4. On every push to `main` branch, auto-deploy

**Using Azure CLI**
```bash
az webapp deployment source config-zip \
  --resource-group nagarparishad-rg \
  --name nagarparishad-api \
  --src deploy.zip
```

---

### Phase 2: Frontend Deployment

#### Step 2.1: Add Multilingual Support

**Update Frontend Code:**
1. Install i18n library (e.g., `react-i18next`, `vue-i18n`)
2. Create translation files:
   ```
   /locales
     /en
       common.json
       certificate.json
     /mr
       common.json
       certificate.json
   ```
3. Add language switcher in UI

**Example Translation Structure:**
```json
// locales/en/certificate.json
{
  "title": "Leaving Certificate",
  "studentName": "Student Name",
  "fatherName": "Father Name",
  "search": "Search Certificate"
}

// locales/mr/certificate.json
{
  "title": "सोडण्याचे प्रमाणपत्र",
  "studentName": "विद्यार्थ्याचे नाव",
  "fatherName": "वडिलांचे नाव",
  "search": "प्रमाणपत्र शोधा"
}
```

#### Step 2.2: Deploy to Azure Static Web Apps

1. **Create Static Web App**
   - Azure Portal → Create Resource → Static Web App
   - Connect to GitHub repository
   - Build command: `npm run build`
   - Output location: `dist` or `build`

2. **Configure Custom Domain**
   - Add domain: `certificates.kaamlo.com` (or `www.kaamlo.com`)
   - SSL certificate auto-provisioned

**Alternative: Azure Blob Storage + CDN**
1. Build frontend: `npm run build`
2. Upload to Azure Blob Storage
3. Enable static website hosting
4. Configure Azure CDN for global distribution
5. Add custom domain with SSL

---

### Phase 3: Access Control Setup

#### Public Access (No Authentication)

**Endpoints:**
- `GET /api/students?status=active` - View active certificates
- `GET /api/students/search/:identifier` - Search by student ID/Aadhar
- `GET /api/students/:id` - View certificate details (if status=active)

**Frontend Routes:**
- `/` - Home page (language selection)
- `/search` - Certificate search
- `/certificate/:id` - View certificate (read-only)

#### Office Access (Authentication Required)

**Endpoints:**
- All CRUD operations require JWT token
- Admin endpoints: `/api/students` (POST, PUT, DELETE)
- Super Admin endpoints: `/api/students/:id/status` (PATCH)

**Frontend Routes:**
- `/admin/login` - Admin login
- `/admin/dashboard` - Admin dashboard
- `/admin/students` - Manage students
- `/admin/review` - Review pending certificates (Super Admin)

**Security:**
- JWT tokens expire in 15 minutes
- Refresh token mechanism
- Role-based access control (RBAC)

---

## Network Architecture

### Public Access Flow

```
Citizen (Browser)
    │
    │ HTTPS
    ▼
Azure Static Web App (Frontend)
    │
    │ API Calls
    ▼
Azure App Service (Backend API)
    │
    │ Database Query
    ▼
On-Premise PostgreSQL
    │
    │ (Only active records)
    ▼
Response with Certificate Data
```

### Office Access Flow

```
Office User (Browser)
    │
    │ HTTPS
    ▼
Azure Static Web App (Admin UI)
    │
    │ API Calls + JWT Token
    ▼
Azure App Service (Backend API)
    │
    │ Authenticated Query
    ▼
On-Premise PostgreSQL
    │
    │ (All records, based on role)
    ▼
Response with Full Data
```

---

## Database Security

### 1. **Connection Security**

**Option A: Port Forwarding with IP Whitelist**
- Only allow Azure App Service outbound IPs
- Use strong PostgreSQL passwords
- Enable SSL connections

**Option B: VPN (Recommended)**
- Site-to-Site VPN between Azure and office
- Database accessible only via private network
- No public port exposure

### 2. **Database Access Control**

```sql
-- Create read-only user for public access
CREATE USER public_readonly WITH PASSWORD 'strong_password';
GRANT SELECT ON students TO public_readonly;
GRANT SELECT ON schools TO public_readonly;

-- Only allow SELECT on active records
CREATE POLICY public_readonly_policy ON students
  FOR SELECT
  USING (status = 'active');
```

### 3. **Application-Level Security**

- Public endpoints only return `status='active'` records
- Admin endpoints require authentication
- Role-based filtering in application code

---

## Multilingual Implementation

### Backend API

**Current State:**
- Database stores Marathi text (UTF-8)
- API returns data as-is

**Enhancement Options:**

1. **API Accept-Language Header**
   ```javascript
   // In routes/students.js
   router.get('/', (req, res) => {
     const lang = req.headers['accept-language'] || 'en';
     // Return data with language preference
   });
   ```

2. **Translation Service (Optional)**
   - Store translations in database
   - API returns both Marathi and English
   - Frontend chooses based on user selection

### Frontend Implementation

**Using react-i18next (React) or vue-i18n (Vue):**

```javascript
// i18n setup
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: require('./locales/en/common.json') },
      mr: { translation: require('./locales/mr/common.json') }
    },
    lng: localStorage.getItem('language') || 'mr', // Default Marathi
    fallbackLng: 'en'
  });
```

**Language Switcher Component:**
```jsx
<select onChange={(e) => i18n.changeLanguage(e.target.value)}>
  <option value="mr">मराठी</option>
  <option value="en">English</option>
</select>
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Database backup created
- [ ] Environment variables documented
- [ ] SSL certificates ready (or use Azure managed)
- [ ] DNS records prepared
- [ ] Router port forwarding configured
- [ ] Windows Firewall rules set
- [ ] PostgreSQL `pg_hba.conf` updated

### Backend Deployment

- [ ] Azure App Service created
- [ ] Application settings configured
- [ ] Database connection tested
- [ ] GitHub Actions workflow created
- [ ] Custom domain configured (`api.kaamlo.com`)
- [ ] SSL certificate installed
- [ ] Health check endpoint working (`/health`)

### Frontend Deployment

- [ ] Multilingual support added
- [ ] Translation files created (Marathi/English)
- [ ] Build process tested locally
- [ ] Static Web App or Blob Storage configured
- [ ] Custom domain configured (`certificates.kaamlo.com`)
- [ ] CDN enabled (if using Blob Storage)
- [ ] Language switcher working

### Security

- [ ] Database access restricted to Azure IPs
- [ ] JWT secrets rotated
- [ ] Public endpoints return only active records
- [ ] Admin endpoints require authentication
- [ ] CORS configured correctly
- [ ] Rate limiting enabled (optional)

### Testing

- [ ] Public search working
- [ ] Public certificate view working
- [ ] Admin login working
- [ ] Admin CRUD operations working
- [ ] Super Admin review/approve working
- [ ] Language switching working
- [ ] Mobile responsive design tested

---

## Cost Estimation (Azure)

### Azure App Service (Backend)
- **Basic Plan**: ~$13/month (B1)
- **Standard Plan**: ~$50/month (S1) - Recommended
- **Custom Domain**: Free
- **SSL Certificate**: Free (App Service Managed)

### Azure Static Web Apps (Frontend)
- **Free Tier**: Up to 100GB bandwidth/month
- **Standard Plan**: ~$9/month (if needed)

### Azure VPN (Optional)
- **Basic VPN Gateway**: ~$30/month
- **Standard VPN Gateway**: ~$140/month

### Total Estimated Cost
- **Minimal Setup**: ~$13-22/month (App Service + Static Web Apps Free)
- **Production Setup**: ~$60-200/month (with VPN)

---

## Monitoring & Maintenance

### 1. **Application Insights**
- Enable Azure Application Insights
- Monitor API response times
- Track errors and exceptions
- Set up alerts for downtime

### 2. **Database Monitoring**
- Monitor connection pool usage
- Track slow queries
- Set up database backups (daily)

### 3. **Logging**
- Application logs in Azure App Service
- Database query logs
- Access logs for security audit

---

## Rollback Plan

1. **Database**: Keep backups before any migration
2. **API**: Azure App Service supports deployment slots (staging/production)
3. **Frontend**: Version control in Git, can revert deployment

---

## Next Steps

1. **Immediate**: Set up Azure App Service and test database connection
2. **Week 1**: Deploy backend API, configure custom domain
3. **Week 2**: Add multilingual support to frontend, deploy frontend
4. **Week 3**: Security hardening, VPN setup (if needed)
5. **Week 4**: Testing, monitoring setup, go-live

---

## Support & Documentation

- **API Documentation**: Swagger UI at `https://api.kaamlo.com/api-docs`
- **Database Schema**: See `CONSOLIDATED_SCHEMA.md`
- **RBAC Setup**: See `RBAC_SETUP.md`
- **Status Workflow**: See `STATUS_WORKFLOW.md`

---

**Last Updated**: 2024



