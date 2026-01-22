# Fix: Certificate Not Stored as Files

You generated the certificate but chose "No (additional) store steps" (option 5), so the certificate wasn't saved as PEM files for nginx.

## Solution: Re-run WinACME and Store as PEM Files

### Step 1: Run WinACME Again

```cmd
cd C:\win-acme
wacs.exe
```

### Step 2: Choose "A: Manage renewals"

```
A: Manage renewals (1 total)
```

### Step 3: Select Your Certificate

You should see your certificate listed. Select it.

### Step 4: Choose "R: Run renewal"

This will re-run the renewal process, and you can add storage steps this time.

### Step 5: When Prompted for Storage, Choose PEM Files

```
How would you like to store the certificate?: 2
```

**Option 2: PEM encoded files (Apache, nginx, etc.)**

### Step 6: Specify Storage Location

It will ask where to store the files. Choose a location like:
```
C:\nginx\ssl\api.kaamlo.com\
```

Or accept the default location (usually in the win-acme folder).

---

## Alternative: Check Windows Certificate Store

If the certificate was stored in Windows Certificate Store, you can export it:

### Step 1: Open Certificate Manager

1. Press `Win + R`
2. Type: `certlm.msc` and press Enter
3. Navigate to: **Personal** → **Certificates**
4. Look for certificate with subject: `api.kaamlo.com`

### Step 2: Export Certificate

1. Right-click the certificate → **All Tasks** → **Export**
2. Choose **Yes, export the private key**
3. Choose **Personal Information Exchange - PKCS #12 (.PFX)**
4. Set a password
5. Save as `api.kaamlo.com.pfx`

### Step 3: Convert PFX to PEM Files

You'll need OpenSSL to convert:

```powershell
# Install OpenSSL (if not installed)
# Or download from: https://slproweb.com/products/Win32OpenSSL.html

# Convert PFX to PEM files
openssl pkcs12 -in api.kaamlo.com.pfx -nocerts -out privkey.pem -nodes
openssl pkcs12 -in api.kaamlo.com.pfx -clcerts -nokeys -out cert.pem
openssl pkcs12 -in api.kaamlo.com.pfx -cacerts -nokeys -out chain.pem

# Combine cert and chain for fullchain.pem
type cert.pem chain.pem > fullchain.pem
```

---

## Recommended: Re-run with PEM Storage

The easiest solution is to re-run WinACME and choose PEM file storage:

### Complete Steps:

1. **Run WinACME:**
   ```cmd
   cd C:\win-acme
   wacs.exe
   ```

2. **Choose "A: Manage renewals"**

3. **Select your certificate**

4. **Choose "R: Run renewal"**

5. **When asked about storage:**
   ```
   How would you like to store the certificate?: 2
   ```
   (PEM encoded files)

6. **Specify storage path:**
   ```
   C:\nginx\ssl\api.kaamlo.com\
   ```
   Or accept default location.

7. **Complete the process**

8. **Update nginx config** with the actual file paths

---

## Quick Fix: Add Storage to Existing Renewal

You can also edit the renewal to add storage:

1. Run `wacs.exe`
2. Choose **"A: Manage renewals"**
3. Select your certificate
4. Choose **"E: Edit renewal"** (if available)
5. Add storage step: **PEM files**
6. Save and run renewal

---

## Verify Certificate Files

After storing, verify files exist:

```powershell
# Check default location
Get-ChildItem "C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\api.kaamlo.com\"

# Or check your specified location
Get-ChildItem "C:\nginx\ssl\api.kaamlo.com\"
```

You should see:
- `fullchain.pem` (or `chain.pem` + `cert.pem`)
- `privkey.pem` (or `key.pem`)

---

## Update Nginx Config

Once you have the PEM files, update `nginx/api.kaamlo.com.conf`:

```nginx
ssl_certificate C:/nginx/ssl/api.kaamlo.com/fullchain.pem;
ssl_certificate_key C:/nginx/ssl/api.kaamlo.com/privkey.pem;
```

Or if files are in win-acme folder:
```nginx
ssl_certificate C:/ProgramData/win-acme/httpsacme-v02.api.letsencrypt.org/api.kaamlo.com/fullchain.pem;
ssl_certificate_key C:/ProgramData/win-acme/httpsacme-v02.api.letsencrypt.org/api.kaamlo.com/privkey.pem;
```

---

## Summary

**Problem:** Certificate generated but not saved as files  
**Solution:** Re-run WinACME and choose "PEM encoded files" for storage  
**Location:** Files will be in the location you specify (or default win-acme folder)

After storing as PEM files, you can configure nginx to use them!



