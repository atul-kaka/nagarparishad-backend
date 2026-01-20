# Nginx Troubleshooting Guide

## Warning: Conflicting Server Name

If you see:
```
nginx: [warn] conflicting server name "api.kaamlo.com" on 0.0.0.0:443, ignored
```

This means there are **two server blocks** with the same `server_name` listening on port 443.

### Solution: Check for Duplicate Server Blocks

1. **Check main nginx.conf:**
   ```cmd
   type C:\nginx\conf\nginx.conf
   ```

2. **Look for duplicate server blocks:**
   - Search for `server_name api.kaamlo.com`
   - Search for `listen 443`

3. **Common causes:**
   - The config file is included twice in `nginx.conf`
   - There's a duplicate server block in `nginx.conf` itself
   - Another config file also defines the same server

### Fix Options:

**Option 1: Remove duplicate include**
Edit `C:\nginx\conf\nginx.conf` and make sure `api.kaamlo.com.conf` is included only once:
```nginx
http {
    # ... other config ...
    
    include api.kaamlo.com.conf;  # Only once!
}
```

**Option 2: Comment out duplicate server block**
If there's a duplicate in `nginx.conf`, comment it out:
```nginx
# server {
#     listen 443 ssl;
#     server_name api.kaamlo.com;
#     ...
# }
```

**Option 3: Use different server_name for default**
If you have a default server block, change its server_name:
```nginx
server {
    listen 443 ssl default_server;
    server_name _;  # Use underscore instead of api.kaamlo.com
    ...
}
```

---

## Warning: SSL Stapling Ignored

If you see:
```
nginx: [warn] "ssl_stapling" ignored, no OCSP responder URL in the certificate
```

This is **not an error** - it's just a warning. SSL stapling is disabled because your certificate doesn't have OCSP responder information.

### Solution: Disable SSL Stapling

The config file already has SSL stapling commented out. If you still see the warning, make sure these lines are commented:

```nginx
# ssl_stapling on;
# ssl_stapling_verify on;
```

This warning is **safe to ignore** - your SSL certificate will work fine without stapling.

---

## Test Configuration

After fixing issues:

```cmd
cd C:\nginx
nginx.exe -t
```

Should see:
```
nginx: the configuration file C:\nginx/conf/nginx.conf syntax is ok
nginx: configuration file C:\nginx/conf/nginx.conf test is successful
```

---

## Reload Nginx

```cmd
nginx.exe -s reload
```

Or restart:
```cmd
nginx.exe -s stop
nginx.exe
```

---

## Verify It's Working

```powershell
# Test HTTPS
curl https://api.kaamlo.com/health

# Test in browser
# Visit: https://api.kaamlo.com/health
```

---

## Common Issues

### Port Already in Use

```powershell
# Find what's using port 443
netstat -ano | findstr :443

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

### Certificate File Not Found

```powershell
# Verify files exist
Test-Path "C:\ssl\api.kaamlo.com\api.kaamlo.com-chain.pem"
Test-Path "C:\ssl\api.kaamlo.com\api.kaamlo.com-key.pem"
```

### Permission Denied

Run nginx as Administrator:
```cmd
# Right-click Command Prompt → Run as Administrator
cd C:\nginx
nginx.exe
```

---

## Check Nginx Logs

```cmd
# View error log
type C:\nginx\logs\error.log

# View access log
type C:\nginx\logs\api.kaamlo.com.access.log
```

