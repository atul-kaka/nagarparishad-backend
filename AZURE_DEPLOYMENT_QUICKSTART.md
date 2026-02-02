# Azure Deployment Quick Start Guide

## Prerequisites

- Azure account (free tier available)
- GitHub account (for code repository)
- Your database server IP: `152.56.13.233`
- Your domain: `kaamlo.com`

---

## Step 1: Prepare Your Code

### 1.1 Push Code to GitHub

```bash
cd nagarparishad-backend
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/nagarparishad-backend.git
git push -u origin main
```

### 1.2 Create `.env.example` for Reference

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nagarparishad_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
NODE_ENV=production
PORT=8080
```

---

## Step 2: Create Azure App Service (Backend)

### 2.1 Using Azure Portal

1. **Login to Azure Portal**: https://portal.azure.com
2. **Create Resource** → Search "Web App" → Create
3. **Fill in details**:
   - **Subscription**: Your subscription
   - **Resource Group**: Create new `nagarparishad-rg`
   - **Name**: `nagarparishad-api` (must be globally unique)
   - **Publish**: Code
   - **Runtime stack**: Node 18 LTS
   - **Operating System**: Linux
   - **Region**: Choose closest to your location (e.g., Central India)
   - **App Service Plan**: Create new → Basic B1 (~$13/month) or Free F1 (for testing)

4. **Click Review + Create** → **Create**

### 2.2 Configure Application Settings

1. Go to your App Service → **Configuration** → **Application settings**
2. Click **+ New application setting** and add:

```
Name: DB_HOST
Value: 152.56.13.233

Name: DB_PORT
Value: 5432

Name: DB_NAME
Value: nagarparishad_db

Name: DB_USER
Value: <your_postgres_user>

Name: DB_PASSWORD
Value: <your_postgres_password>

Name: JWT_SECRET
Value: <generate_strong_secret>

Name: NODE_ENV
Value: production

Name: PORT
Value: 8080
```

3. Click **Save** → **Continue** (restarts the app)

### 2.3 Deploy Code from GitHub

1. Go to **Deployment Center**
2. **Source**: GitHub
3. **Authorize** Azure to access your GitHub
4. **Organization**: Your GitHub username
5. **Repository**: `nagarparishad-backend`
6. **Branch**: `main`
7. **Click Save**

Azure will create a GitHub Actions workflow that auto-deploys on every push.

---

## Step 3: Configure Custom Domain (api.kaamlo.com)

### 3.1 Add Custom Domain

1. Go to **Custom domains** → **Add custom domain**
2. **Domain**: `api.kaamlo.com`
3. **Validation type**: DNS
4. Azure will show you DNS records to add

### 3.2 Update DNS Records

Go to your DNS provider (where `kaamlo.com` is hosted) and add:

**Option A: CNAME (Recommended)**
```
Type: CNAME
Name: api
Value: nagarparishad-api.azurewebsites.net
TTL: 3600
```

**Option B: A Record**
```
Type: A
Name: api
Value: <Azure App Service IP> (shown in Custom domains)
TTL: 3600
```

### 3.3 Enable SSL

1. After DNS validation, go to **TLS/SSL settings**
2. Click **+ Add TLS/SSL binding**
3. **Hostname**: `api.kaamlo.com`
4. **Certificate**: **App Service Managed Certificate** (free)
5. Click **Add**

Wait 5-10 minutes for certificate provisioning.

---

## Step 4: Configure Database Access

### 4.1 Get Azure App Service Outbound IPs

1. Go to App Service → **Properties**
2. Note down **Outbound IP addresses** (list of IPs)

### 4.2 Configure PostgreSQL

**On your database server:**

1. **Edit `postgresql.conf`**:
   ```conf
   listen_addresses = '*'
   ```

2. **Edit `pg_hba.conf`**:
   ```conf
   # Allow Azure App Service IPs
   host    all    all     <Azure_IP_1>/32    md5
   host    all    all     <Azure_IP_2>/32    md5
   host    all    all     <Azure_IP_3>/32    md5
   # ... add all outbound IPs
   ```

3. **Restart PostgreSQL service**

### 4.3 Configure Router Port Forward

1. Log in to your router (usually `192.168.31.1`)
2. Go to **Port Forwarding** or **Virtual Server**
3. Add rule:
   - **External Port**: 5432
   - **Internal IP**: `192.168.31.47` (your DB machine)
   - **Internal Port**: 5432
   - **Protocol**: TCP

### 4.4 Configure Windows Firewall

1. **Windows Defender Firewall** → **Advanced settings**
2. **Inbound Rules** → **New Rule**
3. **Port** → **TCP** → **5432**
4. **Allow the connection**
5. **Scope**: **Remote IP address** → Add Azure outbound IPs

---

## Step 5: Test Deployment

### 5.1 Test Health Endpoint

```bash
curl https://api.kaamlo.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

### 5.2 Test Database Connection

```bash
curl https://api.kaamlo.com/api/schools
```

If you get data, database connection is working!

### 5.3 Check Logs

1. Go to App Service → **Log stream**
2. Watch for any errors

---

## Step 6: Deploy Frontend (Optional - If you have frontend code)

### 6.1 Using Azure Static Web Apps

1. **Create Resource** → **Static Web App**
2. **Deployment details**:
   - **Source**: GitHub
   - **Repository**: Your frontend repo
   - **Branch**: `main`
   - **Build preset**: Custom
   - **App location**: `/` (or your build folder)
   - **Api location**: (leave empty)
   - **Output location**: `dist` or `build`

3. **Add custom domain**: `certificates.kaamlo.com` or `www.kaamlo.com`

### 6.2 Update Frontend API URL

In your frontend code, update API base URL:

```javascript
// config.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.kaamlo.com';
```

---

## Step 7: Configure CORS (If Frontend on Different Domain)

Update `server.js`:

```javascript
const allowedOrigins = [
  'https://api.kaamlo.com',
  'https://kaamlo.com',
  'https://www.kaamlo.com',
  'https://certificates.kaamlo.com', // Add your frontend domain
  'http://localhost:3000' // For local development
];
```

---

## Troubleshooting

### Database Connection Failed

1. **Check App Service logs**: App Service → **Log stream**
2. **Verify firewall rules**: Ensure Azure IPs are allowed
3. **Test from Azure Console**: App Service → **Console** → Try connecting
4. **Check PostgreSQL is listening**: On DB server, run `netstat -an | findstr 5432`

### SSL Certificate Not Working

1. Wait 10-15 minutes after adding domain
2. Check DNS propagation: `nslookup api.kaamlo.com`
3. Verify CNAME/A record is correct

### Deployment Failed

1. Check **GitHub Actions** logs
2. Verify `package.json` has `"start": "node server.js"`
3. Check **Deployment Center** → **Logs**

---

## Cost Optimization

### Free Tier Options

- **App Service**: Free F1 tier (limited resources, good for testing)
- **Static Web Apps**: Free tier (100GB bandwidth/month)
- **SSL**: Free (App Service Managed Certificate)

### Production Recommendations

- **App Service**: Basic B1 (~$13/month) or Standard S1 (~$50/month)
- **Database**: Keep on-premise (no Azure cost)
- **Total**: ~$13-50/month

---

## Next Steps

1. ✅ Backend deployed and accessible
2. ✅ Database connection working
3. ⏭️ Add multilingual support to frontend
4. ⏭️ Deploy frontend
5. ⏭️ Set up monitoring (Application Insights)
6. ⏭️ Configure automated backups

---

## Quick Commands Reference

### Azure CLI (Optional)

```bash
# Install Azure CLI first: https://aka.ms/installazurecliwindows

# Login
az login

# Create resource group
az group create --name nagarparishad-rg --location centralindia

# Create app service
az webapp create \
  --resource-group nagarparishad-rg \
  --plan nagarparishad-plan \
  --name nagarparishad-api \
  --runtime "NODE:18-lts"

# Set environment variables
az webapp config appsettings set \
  --resource-group nagarparishad-rg \
  --name nagarparishad-api \
  --settings DB_HOST=152.56.13.233 DB_PORT=5432
```

---

**Need Help?** Check the full deployment plan: `DEPLOYMENT_PLAN.md`




