# Fixing 404 Error from Nginx

## Problem
Getting 404 from nginx when accessing `https://localhost/health` with `Host: api.kaamlo.com`

## Diagnosis Steps

### 1. Check if Node.js Backend is Running

```cmd
curl http://localhost:3000/health
```

**Expected:** JSON response from your API  
**If fails:** Start your Node.js server:
```cmd
cd C:\projects\nagarparishad-backend
npm start
# or
pm2 start server.js --name nagarparishad-api
```

### 2. Check if Config File is Included

Open `C:\nginx\conf\nginx.conf` and verify:

```nginx
http {
    # ... other config ...
    
    include api.kaamlo.com.conf;  # Must be present!
}
```

### 3. Check Nginx Error Log

```cmd
type C:\nginx\logs\error.log
```

Look for:
- "no resolver defined" errors
- SSL certificate errors
- Permission denied errors

### 4. Verify Server Block is Active

Check `C:\nginx\conf\api.kaamlo.com.conf` has:

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name api.kaamlo.com;
    
    # ... SSL config ...
    
    location /health {
        proxy_pass http://localhost:3000/health;
        # ... proxy headers ...
    }
}
```

### 5. Test with Full Path

```cmd
curl -k -H "Host: api.kaamlo.com" https://localhost/api/schools
```

### 6. Check for Default Server Block

If there's a default server block in `nginx.conf` that's catching requests, it might override your config.

Look in `C:\nginx\conf\nginx.conf` for:
```nginx
server {
    listen 443 ssl default_server;  # This would catch all requests
    # ...
}
```

If found, either:
- Remove `default_server`
- Or change `server_name` to something else

### 7. Reload Nginx After Changes

```cmd
cd C:\nginx
nginx.exe -t
nginx.exe -s reload
```

## Quick Fix Checklist

- [ ] Node.js server running on port 3000
- [ ] `api.kaamlo.com.conf` included in `nginx.conf`
- [ ] No conflicting default server block
- [ ] Nginx reloaded after config changes
- [ ] SSL certificates exist at specified paths

