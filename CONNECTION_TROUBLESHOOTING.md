# Connection Troubleshooting: api.kaamlo.com

## Error: Failed to connect to api.kaamlo.com port 443

This means the connection to port 443 is being blocked or nginx isn't listening.

---

## Step 1: Check DNS Resolution

```powershell
# Check if DNS resolves correctly
nslookup api.kaamlo.com

# Should return your server's IP address
```

If DNS doesn't resolve:
- Wait for DNS propagation (can take up to 48 hours)
- Verify DNS A record is correct in your domain registrar
- Check: https://www.whatsmydns.net/#A/api.kaamlo.com

---

## Step 2: Check if Nginx is Running

```cmd
# Check if nginx process is running
tasklist | findstr nginx

# Check if nginx is listening on ports 80 and 443
netstat -ano | findstr :80
netstat -ano | findstr :443
```

**If nginx is not running:**
```cmd
cd C:\nginx
nginx.exe
```

**If nginx is not listening on port 443:**
- Check nginx error log: `type C:\nginx\logs\error.log`
- Verify config: `nginx.exe -t`

---

## Step 3: Check Firewall

### Windows Firewall

**Check if ports are allowed:**
```powershell
# Check firewall rules
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*nginx*" -or $_.DisplayName -like "*443*"}
```

**Add firewall rules (Run as Administrator):**
```powershell
# Allow HTTP (port 80)
New-NetFirewallRule -DisplayName "Nginx HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow

# Allow HTTPS (port 443)
New-NetFirewallRule -DisplayName "Nginx HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

**Or via Command Prompt (as Admin):**
```cmd
netsh advfirewall firewall add rule name="Nginx HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="Nginx HTTPS" dir=in action=allow protocol=TCP localport=443
```

---

## Step 4: Test Local Connection

### Test from the Server Itself

```powershell
# Test localhost
curl https://localhost/health

# Test 127.0.0.1
curl https://127.0.0.1/health

# Test with IP address (if DNS not working)
curl https://YOUR_SERVER_IP/health
```

If localhost works but domain doesn't → DNS issue  
If localhost doesn't work → nginx configuration issue

---

## Step 5: Check Nginx Configuration

### Verify Config

```cmd
cd C:\nginx
nginx.exe -t
```

### Check if nginx is listening on all interfaces

Verify in `C:\nginx\conf\api.kaamlo.com.conf`:
```nginx
server {
    listen 443 ssl;  # Should listen on all interfaces (0.0.0.0:443)
    # NOT: listen 127.0.0.1:443 ssl;  # This would only listen on localhost
}
```

### Check Error Logs

```cmd
type C:\nginx\logs\error.log
```

Look for:
- SSL certificate errors
- Permission denied errors
- Port already in use errors

---

## Step 6: Test from Different Network

### If Testing from Same Network

If you're on the same local network (192.168.x.x), try:
```powershell
# Use the local IP directly
curl https://192.168.31.47/health

# Or add to hosts file for testing
# Edit C:\Windows\System32\drivers\etc\hosts
# Add: 192.168.31.47 api.kaamlo.com
```

### If Testing from Internet

- Make sure your router has port forwarding:
  - Port 80 → Your server IP (192.168.31.47)
  - Port 443 → Your server IP (192.168.31.47)
- Check if your ISP blocks ports 80/443
- Verify your public IP matches DNS A record

---

## Step 7: Check Router/Network Settings

### Port Forwarding

If accessing from outside your network:
1. Log into your router
2. Set up port forwarding:
   - External Port 80 → Internal IP 192.168.31.47:80
   - External Port 443 → Internal IP 192.168.31.47:443

### Check if Server is Behind NAT

If your server is behind a router:
- DNS A record should point to your **public IP** (not 192.168.x.x)
- Router should forward ports 80/443 to your server

---

## Quick Diagnostic Commands

Run these to diagnose:

```powershell
# 1. Check DNS
nslookup api.kaamlo.com

# 2. Check if nginx is running
tasklist | findstr nginx

# 3. Check if ports are listening
netstat -ano | findstr ":443"

# 4. Test localhost
curl https://localhost/health

# 5. Check firewall
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*443*"}

# 6. Check nginx logs
type C:\nginx\logs\error.log
```

---

## Common Solutions

### Solution 1: Start Nginx

```cmd
cd C:\nginx
nginx.exe
```

### Solution 2: Open Firewall Ports

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Nginx HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

### Solution 3: Fix DNS

- Verify A record in domain registrar
- Wait for DNS propagation
- Use hosts file for local testing

### Solution 4: Check Router Port Forwarding

- Forward port 443 to 192.168.31.47:443
- Forward port 80 to 192.168.31.47:80

---

## Test After Fixes

```powershell
# Test locally first
curl https://localhost/health

# Then test via domain
curl https://api.kaamlo.com/health
```

---

## Still Not Working?

1. **Check nginx error log:** `type C:\nginx\logs\error.log`
2. **Verify Node.js server is running:** `curl http://localhost:3000/health`
3. **Test with IP instead of domain:** `curl https://YOUR_IP/health`
4. **Check if you're behind a firewall/proxy**




