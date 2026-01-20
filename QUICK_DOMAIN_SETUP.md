# Quick Setup Guide for api.kaamlo.com

## Step-by-Step Instructions

### 1. Configure DNS (5 minutes)

1. Log into your domain registrar (GoDaddy, Namecheap, etc.)
2. Go to DNS Management
3. Add A Record:
   ```
   Type: A
   Name: api
   Value: YOUR_SERVER_PUBLIC_IP
   TTL: 3600
   ```
4. Save and wait 5-30 minutes

**Verify DNS:**
```bash
nslookup api.kaamlo.com
# Should return your server IP
```

---

### 2. Install Nginx (5 minutes)

**Windows:**
- Download: http://nginx.org/en/download.html
- Extract to `C:\nginx`

**Linux:**
```bash
sudo apt update && sudo apt install nginx -y
```

---

### 3. Copy Nginx Config (2 minutes)

**Linux:**
```bash
sudo cp nginx/api.kaamlo.com.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/api.kaamlo.com.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Windows:**
- Copy `nginx/api.kaamlo.com.conf` to `C:\nginx\conf\`
- Edit `C:\nginx\conf\nginx.conf` and add:
  ```nginx
  include api.kaamlo.com.conf;
  ```
- Test: `C:\nginx\nginx.exe -t`
- Start: `C:\nginx\nginx.exe`

---

### 4. Install SSL Certificate (5 minutes)

**Linux (Easiest):**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.kaamlo.com
```

Follow prompts:
- Enter email
- Agree to terms
- Choose redirect HTTP to HTTPS (option 2)

**Windows:**
1. Download Certbot: https://certbot.eff.org/
2. Run: `certbot certonly --standalone -d api.kaamlo.com`
3. Update nginx config with certificate paths

---

### 5. Open Firewall Ports (2 minutes)

**Windows (PowerShell as Admin):**
```powershell
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

**Linux:**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

### 6. Install PM2 (Process Manager) (2 minutes)

```bash
npm install -g pm2
cd nagarparishad-backend
pm2 start server.js --name nagarparishad-api
pm2 save
pm2 startup
```

---

### 7. Test Your API (1 minute)

```bash
# Test HTTP (should redirect)
curl -I http://api.kaamlo.com/health

# Test HTTPS
curl https://api.kaamlo.com/health

# Test API endpoint
curl https://api.kaamlo.com/api/schools
```

**In Browser:**
Visit: `https://api.kaamlo.com/health`

---

## Troubleshooting

### DNS Not Working?
- Wait up to 48 hours for full propagation
- Check: https://www.whatsmydns.net/#A/api.kaamlo.com

### SSL Certificate Issues?
```bash
sudo certbot certificates
sudo certbot renew
```

### 502 Bad Gateway?
- Check if Node.js server is running: `pm2 list`
- Restart: `pm2 restart nagarparishad-api`

### Connection Refused?
- Check firewall: `sudo ufw status`
- Check nginx: `sudo systemctl status nginx`

---

## Your API is Now Live!

✅ **API URL:** `https://api.kaamlo.com`  
✅ **Health Check:** `https://api.kaamlo.com/health`  
✅ **Schools:** `https://api.kaamlo.com/api/schools`  
✅ **Students:** `https://api.kaamlo.com/api/students`  
✅ **Certificates:** `https://api.kaamlo.com/api/certificates`

---

## Next Steps

1. ✅ Test all endpoints
2. ⚠️ Add API authentication (JWT tokens)
3. ⚠️ Set up monitoring
4. ⚠️ Configure backups
5. ⚠️ Set up rate limiting

See `DOMAIN_SETUP.md` for detailed instructions and advanced configuration.

