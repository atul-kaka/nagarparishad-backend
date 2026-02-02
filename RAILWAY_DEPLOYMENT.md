# Railway Deployment Guide (Alternative to Azure)

## Why Railway?

Railway is a great alternative to Azure for deploying Node.js applications:
- ✅ **Simpler** than Azure
- ✅ **Cheaper** (₹400/month vs ₹1,000-3,800)
- ✅ **Traditional Express apps** (no refactoring needed)
- ✅ **Easy deployment** from GitHub
- ✅ **Free tier available** for testing

---

## Cost Comparison

| Platform | Free Tier | Production |
|----------|-----------|------------|
| **Railway** | ₹0 (500 hours/month) | ₹400/month (~$5) |
| **Azure** | ₹0 (F1, limited) | ₹1,000-3,800/month |
| **Vercel** | ₹0 | ₹1,500/month (Pro) |

**Railway is the cheapest option for traditional Express apps!**

---

## Step-by-Step: Deploy to Railway

### Step 1: Sign Up

1. Go to https://railway.app
2. Sign up with GitHub (recommended)
3. Free tier includes 500 hours/month

### Step 2: Create New Project

1. **New Project** → **Deploy from GitHub repo**
2. Select your `nagarparishad-backend` repository
3. Railway will auto-detect Node.js

### Step 3: Configure Environment Variables

1. Go to project → **Variables** tab
2. Add environment variables:

```
DB_HOST=152.56.13.233
DB_PORT=5432
DB_NAME=nagarparishad_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret
NODE_ENV=production
PORT=8080
```

### Step 4: Configure Build Settings

Railway auto-detects, but you can customize:

1. Go to **Settings** → **Deploy**
2. **Build Command**: `npm install` (default)
3. **Start Command**: `npm start` (default)

### Step 5: Deploy

Railway automatically deploys when you:
- Push to GitHub
- Update environment variables
- Click **Redeploy**

### Step 6: Get Public URL

1. Go to **Settings** → **Networking**
2. Railway provides a public URL: `https://your-app.up.railway.app`
3. Or add custom domain: `api.kaamlo.com`

### Step 7: Configure Custom Domain

1. **Settings** → **Networking** → **Custom Domain**
2. Add: `api.kaamlo.com`
3. Add DNS CNAME:
   ```
   Type: CNAME
   Name: api
   Value: your-app.up.railway.app
   ```
4. Railway auto-provisions SSL certificate

---

## Database Connection Setup

### Same as Azure:

1. **Router port forward**: 5432 → your DB machine
2. **Windows Firewall**: Allow Railway IPs
3. **PostgreSQL `pg_hba.conf`**: Allow Railway IPs

### Get Railway IPs:

Railway uses dynamic IPs. Options:
1. Allow all IPs (less secure, but simpler)
2. Use Railway's static egress IP (Pro plan)
3. Use VPN (more complex)

---

## Railway Pricing

### Free Tier (Hobby)

- ✅ 500 hours/month compute
- ✅ $5 credit/month
- ✅ Unlimited deployments
- ✅ Custom domains
- ✅ Free SSL

**Good for**: Testing, small apps

### Pro Plan ($5/month = ~₹400)

- ✅ Unlimited hours
- ✅ Better performance
- ✅ Static egress IP
- ✅ Team collaboration
- ✅ Priority support

**Good for**: Production

---

## Advantages of Railway

✅ **Simpler than Azure**
- No complex configuration
- Auto-detects Node.js
- One-click deployment

✅ **Cheaper**
- ₹400/month vs ₹1,000-3,800 (Azure)
- Free tier is generous

✅ **Traditional Express**
- No refactoring needed
- Works with your current code
- Connection pooling works

✅ **Easy GitHub Integration**
- Auto-deploy on push
- Preview deployments

---

## Disadvantages

❌ **Less features than Azure**
- No deployment slots
- Limited scaling options
- Smaller ecosystem

❌ **Dynamic IPs**
- Harder to whitelist for database
- Need Pro plan for static IP

---

## Recommended Setup

### Option 1: Railway Only

```
Frontend: Railway (Static site)
Backend: Railway (Express API)
Database: On-premise PostgreSQL
Cost: ₹400/month
```

### Option 2: Hybrid (Best Value)

```
Frontend: Vercel (Free, fast CDN)
Backend: Railway (₹400/month)
Database: On-premise PostgreSQL
Cost: ₹400/month
```

### Option 3: Full Azure

```
Frontend: Azure Static Web Apps
Backend: Azure App Service
Database: On-premise PostgreSQL
Cost: ₹1,000-3,800/month
```

---

## Quick Comparison

| Feature | Railway | Azure | Vercel |
|---------|---------|-------|--------|
| **Cost** | ₹400/month | ₹1,000-3,800 | ₹0-1,500 |
| **Ease** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Express Support** | ✅ Full | ✅ Full | ⚠️ Serverless |
| **Free Tier** | ✅ 500 hrs | ✅ Limited | ✅ Generous |
| **Custom Domain** | ✅ Free | ✅ Free | ✅ Free |
| **SSL** | ✅ Free | ✅ Free | ✅ Free |

---

## Recommendation

**For your use case, Railway is the best balance:**
- ✅ Cheaper than Azure
- ✅ Easier than Azure
- ✅ Works with Express (no refactoring)
- ✅ Good free tier for testing

**Deploy to Railway if:**
- You want simplicity
- You want to save money
- You don't need Azure's enterprise features

**Deploy to Azure if:**
- You need enterprise features
- You're already using Azure
- You need deployment slots
- You need advanced scaling

---

**Ready to deploy?** Follow the step-by-step guide above!




