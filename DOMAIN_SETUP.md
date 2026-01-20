# Setting Up api.kaamlo.com

This guide explains how to expose your Nagar Parishad API at `api.kaamlo.com` using nginx as a reverse proxy with SSL.

---

## Prerequisites

1. Domain `kaamlo.com` registered
2. Server machine with public IP address
3. Root/Administrator access to the server
4. Port 80 and 443 open in firewall

---

## Step 1: Configure DNS

### Add A Record for Subdomain

1. Log into your domain registrar (where you bought kaamlo.com)
2. Go to DNS Management
3. Add an **A Record**:
   - **Name/Host:** `api`
   - **Type:** `A`
   - **Value/Points to:** Your server's public IP address
   - **TTL:** 3600 (or default)

**Example:**
```
Type: A
Name: api
Value: 123.45.67.89  (Your server's public IP)
TTL: 3600
```

### Verify DNS Propagation

Wait 5-30 minutes, then verify:

```bash
# Check if DNS is resolving
nslookup api.kaamlo.com
# or
dig api.kaamlo.com

# Should return your server's IP address
```

---

## Step 2: Install Nginx

### Windows

1. Download nginx from: http://nginx.org/en/download.html
2. Extract to `C:\nginx`
3. Or use Chocolatey:
   ```cmd
   choco install nginx
   ```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Linux (CentOS/RHEL)

```bash
sudo yum install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Step 3: Configure Nginx Reverse Proxy

### Create Nginx Configuration

**Windows:** `C:\nginx\conf\api.kaamlo.com.conf`  
**Linux:** `/etc/nginx/sites-available/api.kaamlo.com.conf`

```nginx
server {
    listen 80;
    server_name api.kaamlo.com;

    # Logging
    access_log /var/log/nginx/api.kaamlo.com.access.log;
    error_log /var/log/nginx/api.kaamlo.com.error.log;

    # Increase body size for large requests
    client_max_body_size 10M;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Cache control
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

### Enable Site (Linux)

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/api.kaamlo.com.conf /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Windows Nginx Setup

1. Edit `C:\nginx\conf\nginx.conf`
2. Add this line in the `http` block:
   ```nginx
   include api.kaamlo.com.conf;
   ```
3. Test: `C:\nginx\nginx.exe -t`
4. Start: `C:\nginx\nginx.exe`

---

## Step 4: Install SSL Certificate (Let's Encrypt)

### Option A: Using Certbot (Recommended - Linux)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d api.kaamlo.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (recommended)
```

Certbot will automatically:
- Get SSL certificate
- Configure nginx
- Set up auto-renewal

### Option B: Manual Certificate (Windows/Linux)

1. Install Certbot: https://certbot.eff.org/
2. Run:
   ```bash
   certbot certonly --standalone -d api.kaamlo.com
   ```
3. Certificates will be in:
   - Linux: `/etc/letsencrypt/live/api.kaamlo.com/`
   - Windows: `C:\Certbot\live\api.kaamlo.com\`

### Update Nginx for SSL

Update the nginx config to include SSL:

```nginx
server {
    listen 80;
    server_name api.kaamlo.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.kaamlo.com;

    # SSL Certificate paths (Linux)
    ssl_certificate /etc/letsencrypt/live/api.kaamlo.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.kaamlo.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/api.kaamlo.com.access.log;
    error_log /var/log/nginx/api.kaamlo.com.error.log;

    # Increase body size
    client_max_body_size 10M;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

### Reload Nginx

```bash
# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## Step 5: Configure Firewall

### Allow HTTP and HTTPS

**Windows (PowerShell as Admin):**
```powershell
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

**Linux (UFW):**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

**Linux (firewalld):**
```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## Step 6: Update Backend Configuration

### Update CORS (Optional but Recommended)

Update `server.js` to allow your domain:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://api.kaamlo.com',
    'https://kaamlo.com',
    'http://localhost:3000' // For local development
  ],
  credentials: true
}));
```

### Environment Variables

Update `.env`:

```env
HOST=0.0.0.0
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nagarparishad_db
DB_USER=postgres
DB_PASSWORD=your_password
```

---

## Step 7: Set Up Auto-Renewal for SSL

### Linux (systemd timer - automatic with certbot)

Certbot usually sets this up automatically. Verify:

```bash
sudo systemctl status certbot.timer
```

### Manual Renewal Test

```bash
sudo certbot renew --dry-run
```

### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Renew SSL Certificate"
4. Trigger: Monthly
5. Action: Start a program
6. Program: `C:\Certbot\certbot.exe`
7. Arguments: `renew --quiet`
8. Add: `--post-hook "C:\nginx\nginx.exe -s reload"`

---

## Step 8: Test Your Setup

### Test HTTP (should redirect to HTTPS)

```bash
curl -I http://api.kaamlo.com/health
# Should return 301 redirect
```

### Test HTTPS

```bash
curl https://api.kaamlo.com/health
```

### Test API Endpoints

```bash
# Health check
curl https://api.kaamlo.com/health

# Get schools
curl https://api.kaamlo.com/api/schools

# Create school
curl -X POST https://api.kaamlo.com/api/schools \
  -H "Content-Type: application/json" \
  -d '{"name":"Test School","district":"Nagpur","state":"Maharashtra"}'
```

### Test in Browser

Visit: `https://api.kaamlo.com/health`

---

## Step 9: Set Up Process Manager (PM2) - Recommended

Keep your Node.js server running:

### Install PM2

```bash
npm install -g pm2
```

### Start Server with PM2

```bash
cd nagarparishad-backend
pm2 start server.js --name nagarparishad-api
pm2 save
pm2 startup  # Set up auto-start on boot
```

### PM2 Commands

```bash
pm2 list              # View running processes
pm2 logs nagarparishad-api  # View logs
pm2 restart nagarparishad-api  # Restart
pm2 stop nagarparishad-api  # Stop
```

---

## Troubleshooting

### DNS Not Resolving

1. Check DNS propagation: https://www.whatsmydns.net/
2. Verify A record is correct
3. Wait up to 48 hours for full propagation

### SSL Certificate Issues

```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check nginx SSL config
sudo nginx -t
```

### Nginx Not Starting

```bash
# Check error logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t

# Check if port 80/443 is in use
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
```

### Connection Refused

1. Check if Node.js server is running: `pm2 list`
2. Check if nginx is running: `sudo systemctl status nginx`
3. Verify firewall allows ports 80 and 443
4. Check server logs: `pm2 logs nagarparishad-api`

### 502 Bad Gateway

- Node.js server might not be running
- Check: `curl http://localhost:3000/health`
- Restart server: `pm2 restart nagarparishad-api`

---

## Security Checklist

- ✅ SSL/TLS enabled (HTTPS)
- ✅ Firewall configured
- ✅ CORS restricted to your domains
- ✅ Strong database passwords
- ✅ Regular SSL certificate renewal
- ✅ Keep Node.js and dependencies updated
- ✅ Use environment variables for secrets
- ⚠️ Consider adding API authentication
- ⚠️ Set up rate limiting
- ⚠️ Enable request logging

---

## Production Recommendations

1. **Add Authentication:**
   - Implement JWT tokens
   - Add API key authentication

2. **Rate Limiting:**
   ```javascript
   const rateLimit = require('express-rate-limit');
   app.use('/api/', rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   }));
   ```

3. **Monitoring:**
   - Set up monitoring (PM2 Plus, New Relic, etc.)
   - Set up error tracking (Sentry)

4. **Backup:**
   - Regular database backups
   - Automated backup scripts

5. **Logging:**
   - Centralized logging
   - Log rotation

---

## Summary

✅ DNS A record: `api` → Your server IP  
✅ Nginx reverse proxy configured  
✅ SSL certificate installed (Let's Encrypt)  
✅ Firewall ports 80/443 open  
✅ Node.js server running (PM2)  
✅ API accessible at `https://api.kaamlo.com`

Your API is now live and accessible at `https://api.kaamlo.com`!

