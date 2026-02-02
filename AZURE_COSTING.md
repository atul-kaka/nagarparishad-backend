# Azure Costing Guide - Nagarparishad Deployment

## Cost Breakdown

### 1. Azure App Service (Backend API)

**Pricing Tiers:**

| Tier | Price/Month | CPU | RAM | Storage | Best For |
|------|-------------|-----|-----|---------|----------|
| **Free (F1)** | ₹0 | Shared | 1 GB | 1 GB | Testing/Development |
| **Basic B1** | ~₹1,000 | 1 Core | 1.75 GB | 10 GB | Small production |
| **Basic B2** | ~₹2,000 | 2 Cores | 3.5 GB | 10 GB | Medium traffic |
| **Standard S1** | ~₹3,800 | 1 Core | 1.75 GB | 50 GB | Production (Recommended) |
| **Standard S2** | ~₹7,600 | 2 Cores | 3.5 GB | 50 GB | High traffic |
| **Standard S3** | ~₹15,200 | 4 Cores | 7 GB | 50 GB | Very high traffic |

**Recommendation:**
- **Development/Testing**: Free F1 tier
- **Production (Small)**: Basic B1 (~₹1,000/month)
- **Production (Recommended)**: Standard S1 (~₹3,800/month)

**What's Included:**
- ✅ Custom domain support
- ✅ Free SSL certificate (App Service Managed Certificate)
- ✅ Auto-scaling (Standard tier)
- ✅ Deployment slots (Standard tier)
- ✅ Daily backups (Standard tier)

---

### 2. Azure Static Web Apps (Frontend)

**Pricing:**

| Tier | Price/Month | Bandwidth | Builds | Best For |
|------|-------------|-----------|--------|----------|
| **Free** | ₹0 | 100 GB | 100/month | Small to medium sites |
| **Standard** | ~₹700 | 1 TB | Unlimited | Production |

**Recommendation:**
- **Start with Free tier** (100 GB bandwidth is usually enough)
- Upgrade to Standard only if you exceed 100 GB/month

**What's Included:**
- ✅ Free SSL certificate
- ✅ Global CDN
- ✅ Custom domain
- ✅ GitHub integration

---

### 3. Azure VPN Gateway (Optional - For Secure Database Connection)

**Pricing:**

| Tier | Price/Month | Throughput | Best For |
|------|-------------|-------------|----------|
| **Basic** | ~₹2,300 | 100 Mbps | Small deployments |
| **Standard** | ~₹11,000 | 100 Mbps | Production |
| **High Performance** | ~₹22,000 | 200 Mbps | High traffic |

**Recommendation:**
- **Start without VPN** (use port forwarding with IP whitelist)
- **Add VPN later** if security becomes critical
- **Alternative**: Use Azure Private Link (if database moves to Azure)

**Note:** VPN is optional. You can start with port forwarding and add VPN later.

---

### 4. Application Insights (Monitoring - Optional)

**Pricing:**
- **Free tier**: 5 GB data ingestion/month (usually enough)
- **Pay-as-you-go**: ₹35/GB after free tier

**Recommendation:**
- **Start with Free tier** (5 GB is usually sufficient for small apps)

---

### 5. Azure DNS (If using Azure DNS)

**Pricing:**
- **Free**: First 1 million queries/month
- **After**: ₹0.50 per million queries

**Recommendation:**
- **Use your existing DNS provider** (no Azure cost)
- Only use Azure DNS if you want centralized management

---

## Total Cost Scenarios

### Scenario 1: Minimal Setup (Testing/Development)

```
Azure App Service (Free F1)        ₹0
Azure Static Web Apps (Free)       ₹0
Application Insights (Free)        ₹0
-----------------------------------
Total Monthly Cost                 ₹0
```

**Limitations:**
- App Service: 60 minutes/day compute time, shared resources
- Static Web Apps: 100 GB bandwidth/month
- Good for: Testing, development, low traffic

---

### Scenario 2: Small Production (Recommended Start)

```
Azure App Service (Basic B1)       ₹1,000
Azure Static Web Apps (Free)       ₹0
Application Insights (Free)       ₹0
-----------------------------------
Total Monthly Cost                 ₹1,000/month
                                    (~$12/month)
```

**Best for:**
- Small to medium traffic
- Up to ~1,000 API requests/day
- Good performance

---

### Scenario 3: Production (Recommended)

```
Azure App Service (Standard S1)    ₹3,800
Azure Static Web Apps (Free)       ₹0
Application Insights (Free)       ₹0
-----------------------------------
Total Monthly Cost                 ₹3,800/month
                                    (~$45/month)
```

**Best for:**
- Production workloads
- Auto-scaling
- Deployment slots (staging/production)
- Daily backups
- Better performance

---

### Scenario 4: Production with VPN

```
Azure App Service (Standard S1)    ₹3,800
Azure Static Web Apps (Free)       ₹0
Azure VPN Gateway (Basic)          ₹2,300
Application Insights (Free)       ₹0
-----------------------------------
Total Monthly Cost                 ₹6,100/month
                                    (~$73/month)
```

**Best for:**
- Secure database connection
- Enterprise-grade security
- No public database port exposure

---

### Scenario 5: High Traffic Production

```
Azure App Service (Standard S2)    ₹7,600
Azure Static Web Apps (Standard)   ₹700
Application Insights (Free)       ₹0
-----------------------------------
Total Monthly Cost                 ₹8,300/month
                                    (~$100/month)
```

**Best for:**
- High traffic (>10,000 requests/day)
- Multiple concurrent users
- Better performance

---

## Cost Optimization Tips

### 1. **Start with Free Tier**
- Use Free F1 App Service for initial testing
- Use Free Static Web Apps tier
- Upgrade only when needed

### 2. **Use App Service Managed Certificate**
- **Free SSL certificates** (saves ₹500-2,000/month vs paid certificates)
- Automatically renews

### 3. **Keep Database On-Premise**
- **No Azure database costs** (saves ₹3,000-15,000/month)
- Only pay for compute (App Service)

### 4. **Monitor Usage**
- Set up cost alerts in Azure Portal
- Review usage monthly
- Scale down during low-traffic periods

### 5. **Use Reserved Instances (1-3 year commitment)**
- **Save up to 72%** on App Service
- Example: Standard S1 reserved = ~₹1,100/month (vs ₹3,800 pay-as-you-go)
- **Best for**: Long-term deployments (1+ year)

### 6. **Optimize Bandwidth**
- Use CDN for static assets (included in Static Web Apps)
- Compress API responses
- Cache frequently accessed data

---

## Additional Costs (One-Time or Optional)

### 1. **Domain Name**
- **kaamlo.com**: Already owned (no Azure cost)
- If buying new domain: ₹500-1,500/year

### 2. **SSL Certificate**
- **Free**: App Service Managed Certificate (recommended)
- **Paid**: ₹500-2,000/year (not needed)

### 3. **Backup Storage**
- **Included**: Standard tier includes daily backups
- **Additional**: ₹15/GB/month if you need extra retention

### 4. **Data Transfer**
- **Outbound data**: First 5 GB free, then ₹7/GB
- **Inbound data**: Always free
- **Typical usage**: <1 GB/month (minimal cost)

---

## Cost Comparison: Azure vs Alternatives

### Azure App Service vs AWS Elastic Beanstalk

| Service | Azure (S1) | AWS (t3.small) |
|---------|------------|----------------|
| Monthly Cost | ₹3,800 | ~₹3,000 |
| SSL Certificate | Free | Free (Let's Encrypt) |
| Auto-scaling | Included | Included |
| Deployment | Easy | Moderate |

**Verdict**: Similar costs, Azure easier to use

### Azure Static Web Apps vs AWS S3 + CloudFront

| Service | Azure (Free) | AWS S3 + CloudFront |
|---------|--------------|---------------------|
| Monthly Cost | ₹0 (100 GB) | ~₹500-1,000 |
| SSL Certificate | Free | Free |
| CDN | Included | Included |

**Verdict**: Azure Static Web Apps is cheaper for small sites

---

## Monthly Cost Summary

### Recommended Starting Plan

```
Component                    Cost/Month
----------------------------------------
Azure App Service (B1)        ₹1,000
Azure Static Web Apps (Free)  ₹0
Application Insights (Free)   ₹0
SSL Certificate (Free)        ₹0
Domain (Already owned)        ₹0
----------------------------------------
TOTAL                        ₹1,000/month
                              (~$12/month)
```

### Production Plan

```
Component                    Cost/Month
----------------------------------------
Azure App Service (S1)        ₹3,800
Azure Static Web Apps (Free)  ₹0
Application Insights (Free)   ₹0
SSL Certificate (Free)        ₹0
Domain (Already owned)        ₹0
----------------------------------------
TOTAL                        ₹3,800/month
                              (~$45/month)
```

---

## Cost Alerts Setup

### How to Set Up Cost Alerts

1. **Azure Portal** → **Cost Management + Billing**
2. **Budgets** → **+ Add**
3. **Set budget**: ₹5,000/month (or your limit)
4. **Alert conditions**: 
   - 80% of budget (₹4,000)
   - 100% of budget (₹5,000)
5. **Email alerts**: Your email address

This will notify you if costs exceed your budget.

---

## Free Tier Limits

### Azure App Service Free (F1)

- ✅ 60 minutes compute time/day
- ✅ 1 GB storage
- ✅ 1 GB outbound data/month
- ❌ No custom domain (use `*.azurewebsites.net`)
- ❌ No SSL certificate
- ❌ No auto-scaling

**Upgrade when:**
- Need custom domain
- Need SSL certificate
- Exceed 60 minutes/day
- Need better performance

### Azure Static Web Apps Free

- ✅ 100 GB bandwidth/month
- ✅ 100 builds/month
- ✅ Free SSL
- ✅ Custom domain
- ✅ Global CDN

**Upgrade when:**
- Exceed 100 GB bandwidth/month
- Need more builds

---

## Cost Savings Strategies

### 1. **Use Development/Staging Slots**
- Test changes without affecting production
- No additional cost (included in Standard tier)

### 2. **Scale Down During Off-Hours**
- Use Azure Automation to scale down at night
- Scale up during business hours
- **Savings**: 30-50% reduction

### 3. **Use Azure Functions for Background Jobs**
- Cheaper than keeping App Service running 24/7
- Pay only for execution time
- **Savings**: 60-80% for background tasks

### 4. **Optimize Database Queries**
- Reduce database load = less App Service resources needed
- Use caching (Redis Cache - optional, ~₹1,500/month)

---

## Estimated Annual Costs

### Small Production (Basic B1)
- **Monthly**: ₹1,000
- **Annual**: ₹12,000 (~$144)

### Production (Standard S1)
- **Monthly**: ₹3,800
- **Annual**: ₹45,600 (~$540)

### Production with Reserved Instance (1 year)
- **Monthly**: ~₹1,100 (after discount)
- **Annual**: ₹13,200 (~$158)
- **Savings**: 72% off

---

## Payment Options

### 1. **Pay-As-You-Go**
- Pay monthly based on usage
- No commitment
- **Best for**: Testing, uncertain usage

### 2. **Reserved Instances (1-3 years)**
- Up to 72% discount
- Requires upfront payment or monthly payment
- **Best for**: Long-term production

### 3. **Azure Credits**
- Free ₹12,000 credit for new accounts (first 30 days)
- Use for testing before production

---

## Cost Calculator

Use Azure Pricing Calculator for exact costs:
https://azure.microsoft.com/pricing/calculator/

**Input:**
- App Service: Standard S1, 1 instance
- Static Web Apps: Free tier
- Region: Central India (or your preferred region)

---

## Summary

### Minimum Cost (Testing)
**₹0/month** - Free tier for both App Service and Static Web Apps

### Recommended Start (Small Production)
**₹1,000/month** (~$12) - Basic B1 App Service + Free Static Web Apps

### Production (Recommended)
**₹3,800/month** (~$45) - Standard S1 App Service + Free Static Web Apps

### With Reserved Instance (1 year)
**₹1,100/month** (~$13) - 72% savings on App Service

**Note**: All prices are approximate and in Indian Rupees. Actual costs may vary based on:
- Region selected
- Currency exchange rates
- Azure pricing updates
- Your actual usage

---

**Last Updated**: 2024




