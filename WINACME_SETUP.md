# Configuring Nginx with WinACME SSL Certificate

This guide assumes you've already generated the SSL certificate using WinACME **AND** stored it as PEM files.

## ⚠️ Important: Certificate Storage

If you chose "No (additional) store steps" during certificate generation, the certificate was NOT saved as PEM files. You need to:

1. Re-run WinACME: `wacs.exe`
2. Choose "A: Manage renewals"
3. Select your certificate
4. Choose "R: Run renewal"
5. When prompted: **Choose "2: PEM encoded files (Apache, nginx, etc.)"** for storage

See `WINACME_FIX.md` for detailed instructions if you didn't store the certificate as files.

---

## Step 1: Find Your WinACME Certificate Location

WinACME typically stores certificates in one of these locations:

### Common Locations:

1. **ProgramData (Recommended):**
   ```
   C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\
   ```

2. **User AppData:**
   ```
   C:\Users\[YourUsername]\AppData\Local\win-acme\httpsacme-v02.api.letsencrypt.org\
   ```

3. **Custom Location:**
   - Check WinACME settings or the folder where you ran WinACME

### Find Your Certificate Files:

Look for a folder named `api.kaamlo.com` inside the win-acme directory. The certificate files should be:
- `fullchain.pem` (or `fullchain.cer`) - Certificate chain
- `privkey.pem` (or `privkey.key`) - Private key

**Example full path:**
```
C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\api.kaamlo.com\
```

---

## Step 2: Verify Certificate Files Exist

Open PowerShell and run:

```powershell
# Check if certificate files exist
$certPath = "C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\api.kaamlo.com"
Test-Path "$certPath\fullchain.pem"
Test-Path "$certPath\privkey.pem"

# Or list all files
Get-ChildItem $certPath
```

If files don't exist, check the alternative locations above.

---

## Step 3: Update Nginx Configuration

### Option A: Edit the nginx config file directly

Edit `nginx/api.kaamlo.com.conf` and update the SSL certificate paths:

```nginx
# HTTPS Server
server {
    listen 443 ssl http2;
    server_name api.kaamlo.com;

    # SSL Certificate paths (Windows - WinACME)
    # Update these paths to match your WinACME certificate location
    ssl_certificate C:/ProgramData/win-acme/httpsacme-v02.api.letsencrypt.org/api.kaamlo.com/fullchain.pem;
    ssl_certificate_key C:/ProgramData/win-acme/httpsacme-v02.api.letsencrypt.org/api.kaamlo.com/privkey.pem;

    # ... rest of configuration
}
```

**Important:** Use forward slashes `/` or escaped backslashes `\\` in nginx paths on Windows.

### Option B: Use relative paths (if nginx is on same drive)

If nginx is on C: drive, you can use:
```nginx
ssl_certificate C:/ProgramData/win-acme/httpsacme-v02.api.letsencrypt.org/api.kaamlo.com/fullchain.pem;
ssl_certificate_key C:/ProgramData/win-acme/httpsacme-v02.api.letsencrypt.org/api.kaamlo.com/privkey.pem;
```

---

## Step 4: Copy Nginx Config to Nginx Directory

### If nginx is installed at `C:\nginx`:

1. Copy the config file:
   ```cmd
   copy nginx\api.kaamlo.com.conf C:\nginx\conf\api.kaamlo.com.conf
   ```

2. Edit `C:\nginx\conf\nginx.conf` and add this line in the `http` block:
   ```nginx
   http {
       # ... other settings
       
       include api.kaamlo.com.conf;
   }
   ```

3. Test nginx configuration:
   ```cmd
   cd C:\nginx
   nginx.exe -t
   ```

4. If test passes, reload nginx:
   ```cmd
   nginx.exe -s reload
   ```

---

## Step 5: Update Certificate Paths in Config

Open `C:\nginx\conf\api.kaamlo.com.conf` and update the SSL certificate paths:

```nginx
server {
    listen 443 ssl http2;
    server_name api.kaamlo.com;

    # Update these paths to your actual WinACME certificate location
    ssl_certificate C:/ProgramData/win-acme/httpsacme-v02.api.letsencrypt.org/api.kaamlo.com/fullchain.pem;
    ssl_certificate_key C:/ProgramData/win-acme/httpsacme-v02.api.letsencrypt.org/api.kaamlo.com/privkey.pem;

    # ... rest of config
}
```

**Note:** 
- Use forward slashes `/` in paths
- Or use escaped backslashes: `C:\\ProgramData\\win-acme\\...`
- Make sure the file extensions match (`.pem` or `.cer`)

---

## Step 6: Test Nginx Configuration

```cmd
cd C:\nginx
nginx.exe -t
```

If you see "syntax is ok" and "test is successful", proceed to the next step.

If there are errors:
- Check that certificate file paths are correct
- Verify files exist at those paths
- Check for typos in the paths

---

## Step 7: Start/Restart Nginx

```cmd
# Stop nginx (if running)
nginx.exe -s stop

# Start nginx
nginx.exe

# Or reload configuration (if already running)
nginx.exe -s reload
```

---

## Step 8: Test Your SSL Certificate

### Test HTTPS Connection:

```powershell
# Test from PowerShell
curl https://api.kaamlo.com/health

# Or test in browser
# Visit: https://api.kaamlo.com/health
```

### Verify SSL Certificate:

```powershell
# Check certificate details
$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2("C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\api.kaamlo.com\fullchain.pem")
$cert | Select-Object Subject, Issuer, NotAfter
```

---

## Step 9: Configure WinACME Auto-Renewal

WinACME should have set up a scheduled task for auto-renewal. Verify:

1. Open **Task Scheduler** (taskschd.msc)
2. Look for a task named something like "win-acme" or "Let's Encrypt"
3. Verify it's enabled and set to run before certificate expiration

### Manual Renewal Test:

If WinACME is in your PATH:
```cmd
wacs.exe --renew
```

Or navigate to WinACME directory and run:
```cmd
cd C:\Program Files\win-acme
wacs.exe --renew
```

---

## Troubleshooting

### Error: "SSL certificate file not found"

1. **Verify file paths:**
   ```powershell
   Test-Path "C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\api.kaamlo.com\fullchain.pem"
   ```

2. **Check file extensions:**
   - WinACME might use `.cer` instead of `.pem`
   - Update nginx config accordingly:
     ```nginx
     ssl_certificate C:/ProgramData/win-acme/.../fullchain.cer;
     ```

3. **Check file permissions:**
   - Nginx needs read access to certificate files
   - Right-click certificate folder → Properties → Security
   - Ensure "Users" or "Everyone" has read permissions

### Error: "SSL: error:0906D06C"

- Certificate and key file paths are incorrect
- Files are corrupted
- Wrong file format

**Solution:**
```powershell
# Verify certificate file
openssl x509 -in "C:\ProgramData\win-acme\...\fullchain.pem" -text -noout

# Verify private key
openssl rsa -in "C:\ProgramData\win-acme\...\privkey.pem" -check
```

### Nginx Won't Start

1. Check nginx error log:
   ```cmd
   type C:\nginx\logs\error.log
   ```

2. Verify port 80 and 443 are not in use:
   ```powershell
   netstat -ano | findstr ":80"
   netstat -ano | findstr ":443"
   ```

3. Run nginx as Administrator if needed

### Certificate Not Trusted in Browser

- Wait a few minutes for DNS propagation
- Clear browser cache
- Try incognito/private mode
- Verify certificate is valid: `https://www.ssllabs.com/ssltest/analyze.html?d=api.kaamlo.com`

---

## Quick Reference: Certificate File Locations

**Default WinACME Location:**
```
C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\api.kaamlo.com\
├── fullchain.pem (or .cer)
└── privkey.pem (or .key)
```

**Nginx Config Path:**
```
C:\nginx\conf\api.kaamlo.com.conf
```

**Nginx Test Command:**
```cmd
C:\nginx\nginx.exe -t
```

**Nginx Reload Command:**
```cmd
C:\nginx\nginx.exe -s reload
```

---

## Next Steps

1. ✅ Verify SSL certificate is working: `https://api.kaamlo.com/health`
2. ✅ Test API endpoints: `https://api.kaamlo.com/api/schools`
3. ✅ Set up WinACME auto-renewal (should be automatic)
4. ⚠️ Configure firewall rules (ports 80, 443)
5. ⚠️ Set up monitoring for certificate expiration

Your API should now be accessible at `https://api.kaamlo.com` with a valid SSL certificate!

