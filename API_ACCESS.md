# Accessing API via api.kaamlo.com

Your API is now accessible via the domain name `api.kaamlo.com` instead of the IP address.

---

## Current Setup

- **Domain:** `api.kaamlo.com`
- **HTTPS:** `https://api.kaamlo.com` (port 443)
- **HTTP:** `http://api.kaamlo.com` (port 80, redirects to HTTPS)
- **Backend:** Proxies to `http://localhost:3000`

---

## Access Your API

### Via HTTPS (Recommended)

```bash
# Health check
curl https://api.kaamlo.com/health

# Get all schools
curl https://api.kaamlo.com/api/schools

# Get all students
curl https://api.kaamlo.com/api/students

# Get all certificates
curl https://api.kaamlo.com/api/certificates
```

### Via Browser

Visit:
- `https://api.kaamlo.com/health`
- `https://api.kaamlo.com/api/schools`
- `https://api.kaamlo.com/api/students`
- `https://api.kaamlo.com/api/certificates`

### Via HTTP (Auto-redirects to HTTPS)

```bash
curl http://api.kaamlo.com/health
# Will automatically redirect to https://api.kaamlo.com/health
```

---

## If Your Node.js Server is on Different IP

If your Node.js server is running on `192.168.31.47:3000` instead of `localhost:3000`, update the nginx config:

### Update nginx Config

Edit `C:\nginx\conf\api.kaamlo.com.conf` and change:

```nginx
# Change this line:
proxy_pass http://localhost:3000;

# To:
proxy_pass http://192.168.31.47:3000;
```

Then reload nginx:
```cmd
cd C:\nginx
nginx.exe -s reload
```

---

## Test Your Setup

### 1. Verify Node.js Server is Running

```bash
# Test direct access (should work)
curl http://localhost:3000/health
# or
curl http://192.168.31.47:3000/health
```

### 2. Test via Domain (HTTPS)

```bash
curl https://api.kaamlo.com/health
```

Should return:
```json
{
  "success": true,
  "message": "Nagar Parishad Backend Service is running",
  "timestamp": "2026-01-19T..."
}
```

### 3. Test API Endpoints

```bash
# Create a school
curl -X POST https://api.kaamlo.com/api/schools \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test School\",\"district\":\"Nagpur\",\"state\":\"Maharashtra\"}"

# Get all schools
curl https://api.kaamlo.com/api/schools
```

---

## Troubleshooting

### Cannot Access via Domain

1. **Check DNS:**
   ```powershell
   nslookup api.kaamlo.com
   ```
   Should return your server's IP address.

2. **Check nginx is running:**
   ```cmd
   tasklist | findstr nginx
   ```

3. **Check Node.js server is running:**
   ```cmd
   netstat -ano | findstr :3000
   ```

4. **Check firewall:**
   - Port 80 (HTTP) should be open
   - Port 443 (HTTPS) should be open

### 502 Bad Gateway

- Node.js server might not be running
- Check: `curl http://localhost:3000/health`
- Start server: `npm start` or `pm2 start server.js`

### SSL Certificate Error

- Certificate might not be valid
- Check certificate expiration
- Verify DNS is pointing to correct IP

### Connection Refused

- Check if nginx is listening on ports 80/443:
  ```cmd
  netstat -ano | findstr :80
  netstat -ano | findstr :443
  ```

---

## Summary

✅ **Access your API at:** `https://api.kaamlo.com`  
✅ **All endpoints work:** `/api/schools`, `/api/students`, `/api/certificates`  
✅ **HTTP redirects to HTTPS automatically**  
✅ **SSL certificate is configured**

Your API is now accessible via the domain name instead of the IP address!




